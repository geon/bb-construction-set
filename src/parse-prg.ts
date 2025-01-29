import { CharBlock } from "./charset-char";
import { unzipObject, zipObject } from "./functions";
import { Level } from "./level";
import { patchBgColors, readBgColors } from "./prg/bg-colors";
import { Sprites } from "./sprite";
import { patchPlatformChars, readPlatformChars } from "./prg/charset-char";
import {
	getPrgStartAddress,
	getPrgByteAtAddress,
	getDataSegments,
	ReadonlyDataSegments,
} from "./prg/io";
import { readItems } from "./prg/items";
import { readBubbleCurrentRectangles } from "./prg/bubble-current-rectangles";
import { patchSidebarChars, readSidebarChars } from "./prg/sidebar-chars";
import { readTiles } from "./prg/tiles";
import { patchMonsters, readMonsters } from "./prg/monsters";
import { readSprites } from "./prg/sprites";
import { readTileBitmaps } from "./prg/tile-bitmap";
import { patchSymmetry, patchBitmaps, patchHoles } from "./tests/misc-patch";
import { readBubbleCurrentPerLineDefaults } from "./prg/bubble-current-per-line-defaults";

export function parsePrg(prg: ArrayBuffer): {
	levels: readonly Level[];
	sprites: Sprites;
	items: CharBlock[];
} {
	const startAddres = getPrgStartAddress(prg);
	const getByte = (address: number) =>
		getPrgByteAtAddress(new DataView(prg), startAddres, address);

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

	const dataSegments = getDataSegments<"mutable">(prg);

	const unzippedLevels = unzipObject(levels);

	patchPlatformChars(dataSegments.platformChars, unzippedLevels.platformChar);
	patchSidebarChars(dataSegments.sidebarChars, unzippedLevels.sidebarChars);
	patchBgColors(
		dataSegments.bgColors,
		unzippedLevels.bgColorLight,
		unzippedLevels.bgColorDark
	);
	patchHoles(
		dataSegments.holeMetadata,
		unzippedLevels.tiles,
		unzippedLevels.bubbleCurrentPerLineDefaults
	);
	patchSymmetry(
		dataSegments.symmetryMetadata,
		unzippedLevels.tiles,
		unzippedLevels.sidebarChars
	);
	patchBitmaps(
		dataSegments.bitmaps,
		unzippedLevels.tiles,
		unzippedLevels.bubbleCurrentPerLineDefaults
	);
	patchMonsters(dataSegments.monsters, unzippedLevels.monsters);
}
