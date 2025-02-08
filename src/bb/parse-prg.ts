import { CharBlock } from "./charset-char";
import { unzipObject, zipObject } from "./functions";
import { Level } from "./level";
import { writeBgColors, readBgColors } from "./prg/bg-colors";
import { Sprites } from "./sprite";
import { readPlatformChars, writePlatformChars } from "./prg/charset-char";
import {
	getPrgStartAddress,
	getPrgByteAtAddress,
	getDataSegments,
	ReadonlyDataSegments,
	DataSegmentName,
} from "./prg/io";
import { readItems } from "./prg/items";
import {
	readBubbleCurrentRectangles,
	writeBubbleCurrentRectangles,
} from "./prg/bubble-current-rectangles";
import { writeSidebarChars, readSidebarChars } from "./prg/sidebar-chars";
import { readTiles } from "./prg/tiles";
import { writeMonsters, readMonsters } from "./prg/monsters";
import { readSprites } from "./prg/sprites";
import { readTileBitmaps } from "./prg/tile-bitmap";
import { writeSymmetry, writeBitmaps, writeHoles } from "./tests/misc-patch";
import { readBubbleCurrentPerLineDefaults } from "./prg/bubble-current-per-line-defaults";

export function parsePrg(prg: ArrayBuffer): {
	levels: readonly Level[];
	sprites: Sprites;
	items: CharBlock[];
} {
	const startAddres = getPrgStartAddress(prg);
	const getByte = (address: number) =>
		getPrgByteAtAddress(new Uint8Array(prg), startAddres, address);

	const dataSegments = getDataSegments(prg);

	const levels = readLevels(dataSegments);
	const sprites = readSprites(getByte);
	const items = readItems(getByte);

	return { levels, sprites, items };
}

function readLevels(dataSegments: ReadonlyDataSegments): ReadonlyArray<Level> {
	const tileBitmaps = readTileBitmaps(
		dataSegments.bitmaps,
		dataSegments.symmetryMetadata
	);

	return zipObject({
		platformChar: readPlatformChars(dataSegments.platformChars),
		...readBgColors(dataSegments.bgColors),
		sidebarChars: readSidebarChars(
			dataSegments.sidebarChars,
			dataSegments.symmetryMetadata
		),
		tiles: readTiles(dataSegments.holeMetadata, tileBitmaps),
		monsters: readMonsters(dataSegments.monsters),
		bubbleCurrentRectangles: readBubbleCurrentRectangles(
			dataSegments.windCurrents
		),
		bubbleCurrentPerLineDefaults: readBubbleCurrentPerLineDefaults(
			dataSegments.holeMetadata,
			tileBitmaps
		),
	});
}

export function patchPrg(prg: ArrayBuffer, levels: readonly Level[]) {
	if (levels.length !== 100) {
		throw new Error(`Wrong number of levels: ${levels.length}. Should be 100.`);
	}

	const prgSegments = getDataSegments<"mutable">(prg);

	const unzippedLevels = unzipObject(levels);

	const newSegments: ReadonlyDataSegments = {
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
		symmetryMetadata: writeSymmetry(
			prgSegments.symmetryMetadata,
			unzippedLevels.tiles,
			unzippedLevels.sidebarChars
		),
		bitmaps: writeBitmaps(
			unzippedLevels.tiles,
			unzippedLevels.bubbleCurrentPerLineDefaults
		),
		monsters: writeMonsters(prgSegments.monsters, unzippedLevels.monsters),
		windCurrents: writeBubbleCurrentRectangles(
			unzippedLevels.bubbleCurrentRectangles
		),
	};

	for (const segmentName of Object.keys(newSegments) as DataSegmentName[]) {
		prgSegments[segmentName].set(newSegments[segmentName]);
	}
}
