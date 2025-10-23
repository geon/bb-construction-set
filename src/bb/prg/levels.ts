import { zipObject, unzipObject, objectEntries } from "../functions";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { Levels } from "../internal-data-formats/levels";
import { readBgColors, writeBgColors } from "./bg-colors";
import { readBubbleCurrentPerLineDefaults } from "./bubble-current-per-line-defaults";
import {
	readBubbleCurrentRectangles,
	writeBubbleCurrentRectangles,
} from "./bubble-current-rectangles";
import { getBubbleSpawnsPatch, readBubbleSpawns } from "./bubble-spawns";
import { readPlatformChars, writePlatformChars } from "./charset-char";
import { levelSegmentLocations } from "./data-locations";
import { DataSegment, patchFromSegment } from "./io";
import {
	getItemSpawnPositionsPatch,
	parseItemSpawnPositions,
} from "./item-spawn-positions";
import { writeHoles, writeSymmetry, writeBitmaps } from "./misc-patch";
import { readMonsters, getMonstersPatch } from "./monsters";
import {
	readSidebarChars,
	writeSidebarChars,
	writeSidebarCharsIndex,
} from "./sidebar-chars";
import { readTileBitmaps } from "./tile-bitmap";
import { readTiles } from "./tiles";

export function readLevels(
	dataSegments: Record<LevelDataSegmentName, DataSegment>
): Levels {
	const tileBitmaps = readTileBitmaps(
		dataSegments.bitmaps.buffer,
		dataSegments.symmetry.buffer
	);

	return zipObject({
		platformChar: readPlatformChars(dataSegments.platformChars.buffer),
		bgColors: readBgColors(dataSegments.bgColors.buffer),
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
		bubbleSpawns: readBubbleSpawns(dataSegments.bubbleSpawns.buffer),
		itemSpawnPositions: parseItemSpawnPositions({
			a: dataSegments.itemSpawnPositionsA.buffer,
			b: dataSegments.itemSpawnPositionsB.buffer,
			c: dataSegments.itemSpawnPositionsC.buffer,
		}),
	});
}

export function getLevelsPatch(levels: Levels) {
	const unzippedLevels = unzipObject(levels);

	const newSegments = {
		platformChars: writePlatformChars(unzippedLevels.platformChar),
		sidebarChars: writeSidebarChars(unzippedLevels.sidebarChars),
		bgColors: writeBgColors(unzippedLevels.bgColors),
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
		getMonstersPatch(unzippedLevels.monsters),
		getBubbleSpawnsPatch(unzippedLevels.bubbleSpawns),
		getItemSpawnPositionsPatch(unzippedLevels.itemSpawnPositions),
	].flat();
}
