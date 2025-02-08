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

	prgSegments.platformChars.set(
		writePlatformChars(unzippedLevels.platformChar)
	);
	prgSegments.sidebarChars.set(writeSidebarChars(unzippedLevels.sidebarChars));
	prgSegments.bgColors.set(
		writeBgColors(unzippedLevels.bgColorLight, unzippedLevels.bgColorDark)
	);
	prgSegments.holeMetadata.set(
		writeHoles(
			unzippedLevels.tiles,
			unzippedLevels.bubbleCurrentPerLineDefaults
		)
	);
	prgSegments.symmetryMetadata.set(
		writeSymmetry(
			prgSegments.symmetryMetadata,
			unzippedLevels.tiles,
			unzippedLevels.sidebarChars
		)
	);
	prgSegments.bitmaps.set(
		writeBitmaps(
			unzippedLevels.tiles,
			unzippedLevels.bubbleCurrentPerLineDefaults
		)
	);
	prgSegments.monsters.set(
		writeMonsters(prgSegments.monsters, unzippedLevels.monsters)
	);
	prgSegments.windCurrents.set(
		writeBubbleCurrentRectangles(unzippedLevels.bubbleCurrentRectangles)
	);
}
