import { groupBy, unzipObject, zipObject } from "./functions";
import { Level } from "./internal-data-formats/level";
import { writeBgColors, readBgColors } from "./prg/bg-colors";
import {
	spriteColors,
	SpriteGroup,
	SpriteGroupLocation,
	spriteGroupLocations,
	SpriteGroupName,
} from "./sprite";
import { characterNames } from "./game-definitions/character-name";
import { readPlatformChars, writePlatformChars } from "./prg/charset-char";
import {
	getDataSegments,
	DataSegment,
	getMutableDataSegments,
	getDataSegment,
} from "./prg/io";
import {
	itemDataSegmentLocations,
	levelSegmentLocations,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "./prg/data-locations";
import {
	LevelDataSegmentName,
	levelDataSegmentNames,
} from "./game-definitions/level-segment-name";
import {
	SpriteDataSegmentName,
	spriteDataSegmentNames,
} from "./game-definitions/sprite-segment-name";
import { readItems, ItemGroups } from "./prg/items";
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
import {
	parseSpriteGroupsFromPrg,
	convertSpriteGroupsToBinFile,
} from "./prg/sprites";
import { readTileBitmaps } from "./prg/tile-bitmap";
import { writeSymmetry, writeBitmaps, writeHoles } from "./misc-patch";
import { readBubbleCurrentPerLineDefaults } from "./prg/bubble-current-per-line-defaults";
import { shadowChars, ShadowStyle } from "./shadow-chars";
import { ReadonlyUint8Array } from "./prg/types";

export function parsePrg(prg: ArrayBuffer): {
	levels: readonly Level[];
	sprites: Record<SpriteGroupName, SpriteGroup>;
	items: ItemGroups;
} {
	const levels = readLevels(getDataSegments(prg, levelSegmentLocations));
	const sprites = parseSpriteGroupsFromPrg(
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

export function parsePrgSpriteBin(prg: ArrayBuffer): Uint8Array {
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const monsterColorsSegment = getDataSegment(
		prg,
		monsterSpriteColorsSegmentLocation
	);
	const spriteBin = convertSpriteGroupsToBinFile(
		parseSpriteGroupsFromPrg(
			segments,
			monsterColorsSegment,
			spriteColors.player
		)
	);
	return spriteBin;
}

export function patchPrgSpritesBin(
	prg: ArrayBuffer,
	spriteGroups: Record<SpriteGroupName, SpriteGroup>
): ArrayBuffer {
	const patchedPrg = prg.slice();

	const prgSpriteSegments = getMutableDataSegments(
		patchedPrg,
		spriteDataSegmentLocations
	);

	const spriteGroupNamesBySegment = groupBy(
		Object.entries(spriteGroupLocations) as [
			SpriteGroupName,
			SpriteGroupLocation
		][],
		([, { segmentName }]) => segmentName,
		([spriteGroupName]) => spriteGroupName
	) as unknown as Record<SpriteDataSegmentName, SpriteGroupName[]>;

	if (
		Object.keys(spriteGroupNamesBySegment).length !==
		spriteDataSegmentNames.length
	) {
		throw new Error("Missing keys in spriteGroupNamesBySegment");
	}

	for (const segmentName of spriteDataSegmentNames) {
		const spriteGroupNames = spriteGroupNamesBySegment[segmentName];

		const sprites = spriteGroupNames.flatMap(
			(name) => spriteGroups[name].sprites
		);

		for (const [index, sprite] of sprites.entries()) {
			prgSpriteSegments[segmentName].buffer.set(sprite.bitmap, index * 64);
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

	return patchedPrg;
}
