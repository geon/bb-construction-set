import { CharBlock } from "./charset-char";
import { strictChunk, unzipObject, zipObject } from "./functions";
import { Level } from "./level";
import { writeBgColors, readBgColors } from "./prg/bg-colors";
import { spriteColors, Sprites } from "./sprite";
import { readPlatformChars, writePlatformChars } from "./prg/charset-char";
import {
	getDataSegments,
	DataSegment,
	getMutableDataSegments,
	getDataSegment,
} from "./prg/io";
import {
	itemDataSegmentLocations,
	ItemDataSegmentName,
	LevelDataSegmentName,
	levelDataSegmentNames,
	levelSegmentLocations,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
	SpriteDataSegmentName,
	spriteDataSegmentNames,
} from "./prg/data-locations";
import { readItems } from "./prg/items";
import {
	readBubbleCurrentRectangles,
	writeBubbleCurrentRectangles,
} from "./prg/bubble-current-rectangles";
import {
	writeSidebarChars,
	readSidebarChars,
	writeSidebarCharsIndex,
} from "./prg/sidebar-chars";
import { readTiles } from "./prg/tiles";
import { writeMonsters, readMonsters } from "./prg/monsters";
import { readSprites } from "./prg/sprites";
import { readTileBitmaps } from "./prg/tile-bitmap";
import { writeSymmetry, writeBitmaps, writeHoles } from "./tests/misc-patch";
import { readBubbleCurrentPerLineDefaults } from "./prg/bubble-current-per-line-defaults";
import { shadowChars, ShadowStyle } from "./shadow-chars";
import { ReadonlyUint8Array } from "./prg/types";

export function parsePrg(prg: ArrayBuffer): {
	levels: readonly Level[];
	sprites: Sprites;
	items: Record<ItemDataSegmentName, CharBlock[]>;
} {
	const levels = readLevels(getDataSegments(prg, levelSegmentLocations));
	const sprites = readSprites(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation),
		spriteColors.player
	);
	const items = readItems(getDataSegments(prg, itemDataSegmentLocations));

	return { levels, sprites, items };
}

function readLevels(
	dataSegments: Record<LevelDataSegmentName, DataSegment>
): ReadonlyArray<Level> {
	const tileBitmaps = readTileBitmaps(
		dataSegments.bitmaps.buffer,
		dataSegments.symmetry.buffer
	);

	return zipObject({
		platformChar: readPlatformChars(dataSegments.platformChars.buffer),
		...readBgColors(dataSegments.bgColors.buffer),
		sidebarChars: readSidebarChars(
			dataSegments.sidebarChars.buffer,
			dataSegments.sidebarCharsIndex.buffer
		),
		tiles: readTiles(dataSegments.holeMetadata.buffer, tileBitmaps),
		monsters: readMonsters(dataSegments.monsters.buffer),
		bubbleCurrentRectangles: readBubbleCurrentRectangles(
			dataSegments.windCurrents.buffer
		),
		bubbleCurrentPerLineDefaults: readBubbleCurrentPerLineDefaults(
			dataSegments.holeMetadata.buffer,
			tileBitmaps
		),
	});
}

export function levelsToSegments(
	prgSegments: Record<LevelDataSegmentName, DataSegment>,
	levels: readonly Level[],
	shadowStyle: ShadowStyle
) {
	if (levels.length !== 100) {
		throw new Error(`Wrong number of levels: ${levels.length}. Should be 100.`);
	}

	const unzippedLevels = unzipObject(levels);

	const newSegments: Record<LevelDataSegmentName, ReadonlyUint8Array> = {
		platformChars: writePlatformChars(unzippedLevels.platformChar),
		sidebarChars: writeSidebarChars(unzippedLevels.sidebarChars),
		bgColors: writeBgColors(
			unzippedLevels.bgColorLight,
			unzippedLevels.bgColorDark
		),
		holeMetadata: writeHoles(
			unzippedLevels.tiles,
			unzippedLevels.bubbleCurrentPerLineDefaults
		),
		symmetry: writeSymmetry(unzippedLevels.tiles),
		sidebarCharsIndex: writeSidebarCharsIndex(unzippedLevels.sidebarChars),
		bitmaps: writeBitmaps(
			unzippedLevels.tiles,
			unzippedLevels.bubbleCurrentPerLineDefaults
		),
		monsters: writeMonsters(
			prgSegments.monsters.buffer,
			unzippedLevels.monsters
		),
		windCurrents: writeBubbleCurrentRectangles(
			unzippedLevels.bubbleCurrentRectangles
		),
		shadowChars: new Uint8Array(shadowChars[shadowStyle].flat()),
	};

	return newSegments;
}

export function patchPrg(
	prg: ArrayBuffer,
	levels: readonly Level[],
	segmentsToPatch: Set<LevelDataSegmentName> | undefined,
	shadowStyle: ShadowStyle
): ArrayBuffer {
	const patchedPrg = prg.slice();

	const prgSegments = getMutableDataSegments(patchedPrg, levelSegmentLocations);
	const newSegments = levelsToSegments(prgSegments, levels, shadowStyle);

	for (const segmentName of segmentsToPatch ?? levelDataSegmentNames) {
		prgSegments[segmentName].buffer.set(
			zipObject({
				originalByte: [...prgSegments[segmentName].buffer],
				newByte: [...newSegments[segmentName]],
			}).map(({ originalByte, newByte }) =>
				mixByte(
					newByte,
					originalByte,
					levelSegmentLocations[segmentName].mask ?? 0b11111111
				)
			)
		);
	}

	return patchedPrg;
}

function mixByte(newByte: number, originalByte: number, mask: number): number {
	return (newByte & mask) | (originalByte & ~mask);
}

export function patchPrgSpritesBin(
	prg: ArrayBuffer,
	newSpriteSegments: Record<SpriteDataSegmentName, Uint8Array>,
	newSpriteColorsSegment: Uint8Array
): ArrayBuffer {
	const patchedPrg = prg.slice();

	const prgSpriteSegments = getMutableDataSegments(
		patchedPrg,
		spriteDataSegmentLocations
	);

	for (const segmentName of spriteDataSegmentNames) {
		// Not sure if the padding byte is garbage or important, so skip it.
		// If it turns out to just be garbage, we can just write the whole segment in one go:
		// prgSegments[segmentName].buffer.set(newSegments[segmentName]);

		const bytesToWrite = strictChunk(
			[...newSpriteSegments[segmentName].entries()],
			// Split into sprites: 63 bytes + 1 byte padding.
			64
		)
			// Remove the padding byte.
			.map((sprite) => sprite.slice(0, -1))
			.flat();

		for (const [index, byte] of bytesToWrite) {
			prgSpriteSegments[segmentName].buffer[index] = byte;
		}
	}

	const prgSpriteColorsSegment = getDataSegment(
		patchedPrg,
		monsterSpriteColorsSegmentLocation
	);
	prgSpriteColorsSegment.buffer.set(newSpriteColorsSegment.slice(0, -1));

	return patchedPrg;
}
