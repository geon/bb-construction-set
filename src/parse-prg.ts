import { CharBlock } from "./charset-char";
import { chunk, unzipObject, zipObject } from "./functions";
import { BubbleCurrents, Level, levelIsSymmetric, Tiles } from "./level";
import { maxAsymmetric } from "./prg/data-locations";
import { patchBgColors, readBgColors } from "./prg/bg-colors";
import { Sprites } from "./sprite";
import { patchPlatformChars, readPlatformChars } from "./prg/charset-char";
import {
	getPrgStartAddress,
	getPrgByteAtAddress,
	getDataSegments,
	ReadonlyDataSegments,
	dataViewSetBytes,
} from "./prg/io";
import { readItems } from "./prg/items";
import { readBubbleCurrentRectangles } from "./prg/bubble-current-rectangles";
import { patchSidebarChars, readSidebarChars } from "./prg/sidebar-chars";
import { readTiles } from "./prg/tiles";
import { patchMonsters, readMonsters } from "./prg/monsters";
import { readSprites } from "./prg/sprites";
import { readTileBitmaps } from "./prg/tile-bitmap";

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
		bubbleCurrents: readBubbleCurrentRectangles(
			dataSegments.windCurrents,
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
		unzippedLevels.bubbleCurrents
	);
	patchSymmetry(
		dataSegments.symmetryMetadata,
		unzippedLevels.tiles,
		unzippedLevels.sidebarChars
	);
	patchBitmaps(
		dataSegments.bitmaps,
		unzippedLevels.tiles,
		unzippedLevels.bubbleCurrents
	);
	patchMonsters(dataSegments.monsters, unzippedLevels.monsters);
}

function patchHoles(
	dataView: DataView,
	tileses: readonly Tiles[],
	bubbleCurrentses: readonly BubbleCurrents[]
) {
	const tilesHalfBytes = tileses.map((tiles) => {
		const topLeft = !tiles[0][10];
		const topRight = !tiles[0][20];
		const bottomLeft = !tiles[24][10];
		const bottomRight = !tiles[24][20];

		return (
			((topLeft ? 1 : 0) << 0) +
			((topRight ? 1 : 0) << 1) +
			((bottomLeft ? 1 : 0) << 2) +
			((bottomRight ? 1 : 0) << 3)
		);
	});

	const currentsHalfBytes = bubbleCurrentses.map((bubbleCurrents) => {
		return (
			// The most significant bits are the bubble current of the top and bottom rows.
			((bubbleCurrents.perLineDefaults[0] & 0b01 ? 1 : 0) << 4) +
			((bubbleCurrents.perLineDefaults[0] & 0b10 ? 1 : 0) << 5) +
			((bubbleCurrents.perLineDefaults[24] & 0b01 ? 1 : 0) << 6) +
			((bubbleCurrents.perLineDefaults[24] & 0b10 ? 1 : 0) << 7)
		);
	});

	const bytes = zipObject({
		tilesHalfBytes,
		currentsHalfBytes,
	}).map(
		({ tilesHalfBytes, currentsHalfBytes }) =>
			tilesHalfBytes + currentsHalfBytes
	);

	dataViewSetBytes(dataView, bytes);
}

function patchSymmetry(
	dataView: DataView,
	tileses: readonly Tiles[],
	sidebarCharses: readonly (CharBlock | undefined)[]
) {
	const asymmetricLevels = tileses.filter((tiles) => !levelIsSymmetric(tiles));
	if (asymmetricLevels.length > maxAsymmetric) {
		throw new Error(
			`Too many asymmetric levels: ${asymmetricLevels.length}. Should be max ${maxAsymmetric}.`
		);
	}

	const tilesBits = tileses.map(
		(tiles) => (levelIsSymmetric(tiles) ? 1 : 0) << 7
	);

	const sidebarCharsBits = sidebarCharses.map(
		(sidebarChars) => (!sidebarChars ? 1 : 0) << 6
	);

	const oldBits = tileses.map(
		(_, index) =>
			// TODO: No idea what the rest of the bits are.
			dataView.getUint8(index) & 0b00111111
	);

	const bytes = zipObject({
		tilesBits,
		sidebarCharsBits,
		oldBits,
	}).map(
		({ tilesBits, sidebarCharsBits, oldBits }) =>
			tilesBits + sidebarCharsBits + oldBits
	);

	// Write symmetry.
	dataViewSetBytes(dataView, bytes);
}

function patchBitmaps(
	dataView: DataView,
	tileses: readonly Tiles[],
	bubbleCurrentses: readonly BubbleCurrents[]
) {
	// Write platforms bitmap
	const levelBitmapBytes = tileses.flatMap((tiles, levelIndex) => {
		const isSymmetric = levelIsSymmetric(tiles);

		const bitRows = [];
		for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
			const row = tiles[rowIndex].slice(0, isSymmetric ? 16 : 32);

			// So stupid.
			const bitPositions = (
				{
					symmetric: [0, 1],
					notSymmetric: [31, 30],
				} as const
			)[isSymmetric ? "symmetric" : "notSymmetric"];

			// Encode the per-line bubble current into the edge of the platforms bitmap.
			row[bitPositions[0]] = !!(
				bubbleCurrentses[levelIndex].perLineDefaults[rowIndex] & 0b01
			);
			row[bitPositions[1]] = !!(
				bubbleCurrentses[levelIndex].perLineDefaults[rowIndex] & 0b10
			);

			bitRows.push(row);
		}

		const byteRows = bitRows
			.map((row) => chunk(row, 8))
			.map((row) =>
				row.map(
					(bits) =>
						((bits[0] ? 1 : 0) << 7) +
						((bits[1] ? 1 : 0) << 6) +
						((bits[2] ? 1 : 0) << 5) +
						((bits[3] ? 1 : 0) << 4) +
						((bits[4] ? 1 : 0) << 3) +
						((bits[5] ? 1 : 0) << 2) +
						((bits[6] ? 1 : 0) << 1) +
						((bits[7] ? 1 : 0) << 0)
				)
			);

		return byteRows.flat();
	});
	const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	if (levelBitmapBytes.length > maxLevelBytes) {
		throw new Error("Too many level bytes.");
	}
	dataViewSetBytes(dataView, levelBitmapBytes);
}
