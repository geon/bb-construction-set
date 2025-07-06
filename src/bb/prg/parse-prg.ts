import { mapRecord, objectEntries, unzipObject, zipObject } from "../functions";
import { Level } from "../internal-data-formats/level";
import { writeBgColors, readBgColors } from "./bg-colors";
import { readPlatformChars, writePlatformChars } from "./charset-char";
import {
	getDataSegments,
	DataSegment,
	getDataSegment,
	patchFromSegment,
	applyPatch,
} from "./io";
import {
	charSegmentLocations,
	itemSegmentLocations,
	largeBonusSpriteColorsSegmentLocation,
	levelSegmentLocations,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "./data-locations";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { getCharGroupsPatch, parseCharGroups } from "./char-groups";
import { getItemPatch, parseItems } from "./items";
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
import { writeMonsters as getPatchMonsters, readMonsters } from "./monsters";
import {
	getSpriteColorsPatch,
	getSpritesPatch,
	parseSpriteGroupsFromPrg,
} from "./sprites";
import { readTileBitmaps } from "./tile-bitmap";
import { writeSymmetry, writeBitmaps, writeHoles } from "./misc-patch";
import { readBubbleCurrentPerLineDefaults } from "./bubble-current-per-line-defaults";
import { ParsedPrg } from "../internal-data-formats/parsed-prg";

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

export function getLevelsPatch(levels: readonly Level[]) {
	if (levels.length !== 100) {
		throw new Error(`Wrong number of levels: ${levels.length}. Should be 100.`);
	}

	const unzippedLevels = unzipObject(levels);

	const newSegments = {
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
		windCurrents: writeBubbleCurrentRectangles(
			unzippedLevels.bubbleCurrentRectangles
		),
	} as const;

	return [
		objectEntries(newSegments).flatMap(([segmentName, newSegment]) =>
			patchFromSegment(levelSegmentLocations[segmentName], newSegment)
		),
		getPatchMonsters(unzippedLevels.monsters),
	].flat();
}

export function patchPrg(prg: ArrayBuffer, parsedPrg: ParsedPrg): ArrayBuffer {
	const {
		levels,
		sprites: spriteGroups,
		chars: charGroups,
		items: itemGroups,
	} = parsedPrg;

	const levelPatch = getLevelsPatch(levels);

	const spritePatch = getSpritesPatch(spriteGroups);

	const spriteColorsPatch = getSpriteColorsPatch(spriteGroups);

	const charPatch = getCharGroupsPatch(charGroups);

	const itemPatch = getItemPatch(itemGroups);

	return applyPatch(
		prg,
		[
			//
			levelPatch,
			spritePatch,
			spriteColorsPatch,
			charPatch,
			itemPatch,
		].flat()
	);
}
