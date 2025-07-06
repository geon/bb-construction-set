import { mapRecord, objectEntries, unzipObject, zipObject } from "../functions";
import { Level } from "../internal-data-formats/level";
import { writeBgColors, readBgColors } from "./bg-colors";
import { characterNames } from "../game-definitions/character-name";
import { readPlatformChars, writePlatformChars } from "./charset-char";
import {
	getDataSegments,
	DataSegment,
	getDataSegment,
	patchFromSegment,
	applyPatch,
	SingleBytePatch,
} from "./io";
import {
	charSegmentLocations,
	itemSegmentLocations,
	largeBonusSpriteColorsSegmentLocation,
	levelSegmentLocations,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
	spriteMasks,
} from "./data-locations";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { spriteGroupNames } from "../game-definitions/sprite-segment-name";
import { parseCharGroups, serializeCharGroups } from "./char-groups";
import { parseItems, serializeItems } from "./items";
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
import { ReadonlyUint8Array } from "../types";
import { ParsedPrg } from "../internal-data-formats/parsed-prg";
import { charSegmentNames } from "../game-definitions/char-segment-name";
import { largeBonusSpriteGroupNames } from "../game-definitions/large-bonus-name";

export function parsePrg(prg: ArrayBuffer): ParsedPrg {
	const levels = readLevels(getDataSegments(prg, levelSegmentLocations));
	const sprites = parseSpriteGroupsFromPrg(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation),
		getDataSegment(prg, largeBonusSpriteColorsSegmentLocation)
	);
	const chars = parseCharGroups(getDataSegments(prg, charSegmentLocations));
	const items = parseItems(
		mapRecord(itemSegmentLocations, (sublocations) =>
			getDataSegments(prg, sublocations)
		)
	);

	return { levels, sprites, chars, items };
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

export function levelsToPatch(
	TODO_REMOVE_THIS_prgSegments: Record<LevelDataSegmentName, DataSegment>,
	levels: readonly Level[]
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
			TODO_REMOVE_THIS_prgSegments.monsters.buffer,
			unzippedLevels.monsters
		),
		windCurrents: writeBubbleCurrentRectangles(
			unzippedLevels.bubbleCurrentRectangles
		),
	};

	return objectEntries(newSegments).flatMap(([segmentName, newSegment]) =>
		patchFromSegment(levelSegmentLocations[segmentName], newSegment)
	);
}

export function patchPrg(prg: ArrayBuffer, parsedPrg: ParsedPrg): ArrayBuffer {
	const {
		levels,
		sprites: spriteGroups,
		chars: charGroups,
		items: itemGroups,
	} = parsedPrg;

	const TODO_REMOVE_THIS_prgSegments = getDataSegments(
		prg,
		levelSegmentLocations
	);
	const levelPatch = levelsToPatch(TODO_REMOVE_THIS_prgSegments, levels);

	const spritePatch = spriteGroupNames.flatMap((segmentName) => {
		const sprites = spriteGroups[segmentName].sprites;

		return sprites.flatMap((sprite, spriteIndex) => {
			const mask = spriteMasks[segmentName];
			const spriteBytes = serializeSprite(sprite);
			return spriteBytes.map((spriteByte, byteIndex): SingleBytePatch => {
				return [
					spriteDataSegmentLocations[segmentName].startAddress +
						spriteIndex * 64 +
						byteIndex,
					spriteByte,
					mask?.[byteIndex] !== false ? undefined : 0x00,
				];
			});
		});
	});

	const spriteColorsSegment = new Uint8Array(
		characterNames
			// The player color is not included in the segment.
			.slice(1)
			.map((name) => spriteGroups[name].color)
	);

	const spriteColorsPatch = patchFromSegment(
		monsterSpriteColorsSegmentLocation,
		spriteColorsSegment
	);

	const largeBonusColors = mapRecord(
		largeBonusSpriteGroupNames,
		(name) => spriteGroups[name].color
	);
	// Hardcoded because I don't have 3 diamonds in the sprite sheet.
	largeBonusColors.yellowDiamond = 7;
	largeBonusColors.purpleDiamond = 4;
	const largeBonusColorsSegment = new Uint8Array(
		Object.values(largeBonusColors)
	);

	const largeBonusColorsPatch = patchFromSegment(
		largeBonusSpriteColorsSegmentLocation,
		largeBonusColorsSegment
	);

	const newCharSegments = serializeCharGroups(charGroups);
	const charPatch = charSegmentNames.flatMap((segmentName) =>
		patchFromSegment(
			charSegmentLocations[segmentName],
			newCharSegments[segmentName].buffer
		)
	);

	const newItemSegments = serializeItems(itemGroups);
	const itemPatch = objectEntries(itemSegmentLocations).flatMap(
		([itemCategoryName, segmentLocations]) =>
			objectEntries(segmentLocations).flatMap(
				([segmentName, segmentLocation]) =>
					patchFromSegment(
						segmentLocation,
						newItemSegments[itemCategoryName][segmentName].buffer
					)
			)
	);

	return applyPatch(
		prg,
		[
			levelPatch,
			spritePatch,
			spriteColorsPatch,
			largeBonusColorsPatch,
			charPatch,
			itemPatch,
		].flat()
	);
}
