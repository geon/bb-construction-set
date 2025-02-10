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
import {
	DataSegmentName,
	dataSegmentNames,
	segmentLocations,
} from "./prg/data-locations";
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
import {
	writeSymmetry,
	writeBitmaps,
	writeHoles,
	writeHasSideBarChars,
} from "./tests/misc-patch";
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
		dataSegments.bitmaps.buffer,
		dataSegments.symmetry.buffer
	);

	return zipObject({
		platformChar: readPlatformChars(dataSegments.platformChars.buffer),
		...readBgColors(dataSegments.bgColors.buffer),
		sidebarChars: readSidebarChars(
			dataSegments.sidebarChars.buffer,
			dataSegments.hasSidebarChars.buffer
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
	prgSegments: ReadonlyDataSegments,
	levels: readonly Level[]
) {
	if (levels.length !== 100) {
		throw new Error(`Wrong number of levels: ${levels.length}. Should be 100.`);
	}

	const unzippedLevels = unzipObject(levels);

	const newSegments: Record<
		DataSegmentName,
		ReadonlyDataSegments[DataSegmentName]["buffer"]
	> = {
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
		hasSidebarChars: writeHasSideBarChars(unzippedLevels.sidebarChars),
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
	};

	return newSegments;
}

export function patchPrg(
	prg: ArrayBuffer,
	levels: readonly Level[],
	segmentsToPatch?: Set<DataSegmentName>
) {
	const prgSegments = getDataSegments<"mutable">(prg);
	const newSegments = levelsToSegments(prgSegments, levels);

	for (const segmentName of segmentsToPatch ?? dataSegmentNames) {
		prgSegments[segmentName].buffer.set(
			zipObject({
				originalByte: [...prgSegments[segmentName].buffer],
				newByte: [...newSegments[segmentName]],
			}).map(({ originalByte, newByte }) =>
				mixByte(
					newByte,
					originalByte,
					segmentLocations[segmentName].mask ?? 0b11111111
				)
			)
		);
	}
}

function mixByte(newByte: number, originalByte: number, mask: number): number {
	return (newByte & mask) | (originalByte & ~mask);
}
