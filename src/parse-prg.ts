import { CharBlock } from "./charset-char";
import { chunk, zipObject } from "./functions";
import {
	bitmapArrayAddress,
	bgColorMetadataArrayAddress,
	holeMetadataArrayAddress,
	symmetryMetadataArrayAddress,
	getDataSegments,
	DataSegments,
} from "./prg/data-locations";
import { Level, levelIsSymmetric } from "./level";
import { maxAsymmetric, maxSidebars } from "./prg/data-locations";
import { readBgColors } from "./prg/bg-colors";
import { Sprites } from "./sprite";
import { patchPlatformChars, readPlatformChars } from "./prg/charset-char";
import {
	getPrgStartAddress,
	getPrgByteAtAddress,
	setPrgByteAtAddress,
} from "./prg/io";
import { readItems } from "./prg/items";
import { readBubbleCurrentRectangles } from "./prg/bubble-current-rectangles";
import { patchSidebarChars, readSidebarChars } from "./prg/sidebar-chars";
import { readTiles } from "./prg/tiles";
import { patchMonsters, readMonsters } from "./prg/monsters";
import { readSprites } from "./prg/sprites";
import { readTileBitmaps } from "./prg/tile-bitmap";
import { GetByte, SetBytes } from "./prg/types";

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

function readLevels(dataSegments: DataSegments): ReadonlyArray<Level> {
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
	const asymmetricLevels = levels.filter(
		(level) => !levelIsSymmetric(level.tiles)
	);
	if (asymmetricLevels.length > maxAsymmetric) {
		throw new Error(
			`Too many asymmetric levels: ${asymmetricLevels.length}. Should be max ${maxAsymmetric}.`
		);
	}
	const sidebarLevels = levels.filter((level) => !!level.sidebarChars);
	if (sidebarLevels.length > maxSidebars) {
		throw new Error(
			`Too many levels with sidebar graphics: ${sidebarLevels.length}. Should be max ${maxSidebars}.`
		);
	}

	const startAddres = getPrgStartAddress(prg);
	const setByte = (address: number, value: number) =>
		setPrgByteAtAddress(new Uint8Array(prg), startAddres, address, value);
	const setBytes = (address: number, bytes: number[]) => {
		let currentAddress = address;
		for (const byte of bytes) {
			setByte(currentAddress, byte);
			++currentAddress;
		}
	};
	const getByte = (address: number) =>
		getPrgByteAtAddress(new DataView(prg), startAddres, address);

	patchPlatformChars(setBytes, levels);
	patchSidebarChars(setBytes, levels);
	patchBgColors(setBytes, levels);
	patchHoles(levels, setBytes);
	patchSymmetry(setBytes, levels, getByte);
	patchBitmaps(levels, setBytes);
	patchMonsters(levels, setBytes, getByte);
}

function patchBgColors(setBytes: SetBytes, levels: readonly Level[]) {
	setBytes(
		bgColorMetadataArrayAddress,
		levels.map((level) => level.bgColorLight + (level.bgColorDark << 4))
	);
}

function patchHoles(levels: readonly Level[], setBytes: SetBytes) {
	const bytes = levels.map((level) => {
		const topLeft = !level.tiles[0][10];
		const topRight = !level.tiles[0][20];
		const bottomLeft = !level.tiles[24][10];
		const bottomRight = !level.tiles[24][20];

		return (
			((topLeft ? 1 : 0) << 0) +
			((topRight ? 1 : 0) << 1) +
			((bottomLeft ? 1 : 0) << 2) +
			((bottomRight ? 1 : 0) << 3) +
			// The most significant bits are the bubble current of the top and bottom rows.
			((level.bubbleCurrents.perLineDefaults[0] & 0b01 ? 1 : 0) << 4) +
			((level.bubbleCurrents.perLineDefaults[0] & 0b10 ? 1 : 0) << 5) +
			((level.bubbleCurrents.perLineDefaults[24] & 0b01 ? 1 : 0) << 6) +
			((level.bubbleCurrents.perLineDefaults[24] & 0b10 ? 1 : 0) << 7)
		);
	});

	setBytes(holeMetadataArrayAddress, bytes);
}

function patchSymmetry(
	setBytes: SetBytes,
	levels: readonly Level[],
	getByte: GetByte
) {
	// Write symmetry.
	setBytes(
		symmetryMetadataArrayAddress,
		levels.map(
			(level, index) =>
				((levelIsSymmetric(level.tiles) ? 1 : 0) << 7) +
				((!level.sidebarChars ? 1 : 0) << 6) +
				// TODO: No idea what the rest of the bits are.
				(getByte(symmetryMetadataArrayAddress + index) & 0b00111111)
		)
	);
}

function patchBitmaps(levels: readonly Level[], setBytes: SetBytes) {
	// Write platforms bitmap
	let foo = bitmapArrayAddress;
	const levelBitmapBytes = levels.flatMap((level) => {
		const isSymmetric = levelIsSymmetric(level.tiles);

		const bitRows = [];
		for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
			const row = level.tiles[rowIndex].slice(0, isSymmetric ? 16 : 32);

			// So stupid.
			const bitPositions = (
				{
					symmetric: [0, 1],
					notSymmetric: [31, 30],
				} as const
			)[isSymmetric ? "symmetric" : "notSymmetric"];

			// Encode the per-line bubble current into the edge of the platforms bitmap.
			row[bitPositions[0]] = !!(
				level.bubbleCurrents.perLineDefaults[rowIndex] & 0b01
			);
			row[bitPositions[1]] = !!(
				level.bubbleCurrents.perLineDefaults[rowIndex] & 0b10
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

		foo += isSymmetric ? 46 : 2 * 46;

		return byteRows.flat();
	});
	const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	if (levelBitmapBytes.length > maxLevelBytes) {
		throw new Error("Too many level bytes.");
	}
	setBytes(bitmapArrayAddress, levelBitmapBytes);
}
