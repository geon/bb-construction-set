import { objectEntries, unzipObject, zipObject } from "../functions";
import { Level } from "../internal-data-formats/level";
import { writeBgColors, readBgColors } from "./bg-colors";
import { characterNames } from "../game-definitions/character-name";
import { readPlatformChars, writePlatformChars } from "./charset-char";
import {
	getDataSegments,
	DataSegment,
	getMutableDataSegments,
	getDataSegment,
} from "./io";
import {
	charSegmentLocations,
	levelSegmentLocations,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "./data-locations";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { spriteGroupNames } from "../game-definitions/sprite-segment-name";
import { parseCharGroups, serializeCharGroups } from "./char-groups";
import {
	readBubbleCurrentRectangles,
	writeBubbleCurrentRectangles,
} from "./bubble-current-rectangles";
import {
	writeSidebarChars,
	readSidebarChars,
	writeSidebarCharsIndex,
} from "./sidebar-chars";
import { readTiles } from "./tiles";
import { writeMonsters, readMonsters } from "./monsters";
import { parseSpriteGroupsFromPrg, serializeSprite } from "./sprites";
import { readTileBitmaps } from "./tile-bitmap";
import { writeSymmetry, writeBitmaps, writeHoles } from "./misc-patch";
import { readBubbleCurrentPerLineDefaults } from "./bubble-current-per-line-defaults";
import { detectShadowStyle, shadowChars, ShadowStyle } from "./shadow-chars";
import { ReadonlyUint8Array } from "../types";
import { ParsedPrg } from "../internal-data-formats/parsed-prg";
import { serializeColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { charSegmentNames } from "../game-definitions/char-segment-name";

export function parsePrg(prg: ArrayBuffer): ParsedPrg {
	const levels = readLevels(getDataSegments(prg, levelSegmentLocations));
	const sprites = parseSpriteGroupsFromPrg(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation)
	);
	const items = parseCharGroups(getDataSegments(prg, charSegmentLocations));

	const shadowStyle = detectShadowStyle(
		getDataSegments(prg, levelSegmentLocations).shadowChars
	);

	return { levels, sprites, chars: items, shadowStyle };
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
		// TODO: Not part of the levels.
		shadowChars: new Uint8Array(
			shadowChars[shadowStyle].flatMap((char) =>
				char.flatMap(serializeColorPixelByte)
			)
		),
	};

	return newSegments;
}

export function patchPrg(
	prg: ArrayBuffer,
	parsedPrg: ParsedPrg,
	shadowStyle: ShadowStyle
): ArrayBuffer {
	const { levels, sprites: spriteGroups, chars: charGroups } = parsedPrg;

	const patchedPrg = prg.slice();

	const prgSegments = getMutableDataSegments(patchedPrg, levelSegmentLocations);
	const newSegments = levelsToSegments(prgSegments, levels, shadowStyle);

	for (const [segmentName, prgSegment] of objectEntries(prgSegments)) {
		prgSegment.buffer.set(
			zipObject({
				originalByte: [...prgSegment.buffer],
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

	const prgSpriteSegments = getMutableDataSegments(
		patchedPrg,
		spriteDataSegmentLocations
	);

	for (const segmentName of spriteGroupNames) {
		const sprites = spriteGroups[segmentName].sprites;

		for (const [index, sprite] of sprites.entries()) {
			prgSpriteSegments[segmentName].buffer.set(
				serializeSprite(sprite),
				index * 64
			);
		}
	}

	const spriteColorsSegment = new Uint8Array(
		characterNames
			// The player color is not included in the segment.
			.slice(1)
			.map((name) => spriteGroups[name].color)
	);

	const prgSpriteColorsSegment = getDataSegment(
		patchedPrg,
		monsterSpriteColorsSegmentLocation
	);
	prgSpriteColorsSegment.buffer.set(spriteColorsSegment);

	const prgItemSegments = getMutableDataSegments(
		patchedPrg,
		charSegmentLocations
	);
	const newItemSegments = serializeCharGroups(charGroups);
	for (const segmentName of charSegmentNames) {
		prgItemSegments[segmentName].buffer.set(
			newItemSegments[segmentName].buffer
		);
	}

	return patchedPrg;
}

function mixByte(newByte: number, originalByte: number, mask: number): number {
	return (newByte & mask) | (originalByte & ~mask);
}
