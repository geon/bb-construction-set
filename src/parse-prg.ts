import { readCharsetChar } from "./charset-char";
import { Level, createLevel, levelHeight, levelWidth } from "./level";

function getPrgStartAddress(prg: DataView): number {
	// The prg contains a little endian 16 bit header with the start address. The rest is the raw data.
	return prg.getUint16(0, true);
}

function getPrgByteAtAddress(
	prg: DataView,
	startAddres: number,
	address: number
): number {
	// Skip the header, then start counting at the startAddress.
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	return prg.getUint8(offset);
}

function isBitSet(byte: number, bitIndex: number): boolean {
	return !!(byte & (0b10000000 >> bitIndex));
}

export function parsePrg(prg: DataView): Level[] {
	const startAddres = getPrgStartAddress(prg);
	const getByte = (address: number) =>
		getPrgByteAtAddress(prg, startAddres, address);

	const platformCharArrayAddress = 0xc26e;
	const sidebarCharArrayAddress = 0xbb0e;
	const bgColorMetadataArrayAddress = 0xff30;
	const holeMetadataArrayAddress = 0xc58e;
	const symmetryMetadataArrayAddress = 0xff94;
	const bitmapArrayAddress = 0xc5f2;

	// TODO: Check the original data size, and verify.
	const levels: Array<Level> = [];
	let curentBitmapByteAddress = bitmapArrayAddress;
	let currentSidebarAddress = sidebarCharArrayAddress;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const level = createLevel();

		level.platformChar = readCharsetChar(
			getByte,
			platformCharArrayAddress + levelIndex * 8
		);

		const bgColorMetadata = getByte(bgColorMetadataArrayAddress + levelIndex);
		level.bgColorLight = bgColorMetadata & 0b1111;
		level.bgColorDark = (bgColorMetadata & 0b11110000) >> 4;

		const holeMetadata = getByte(holeMetadataArrayAddress + levelIndex);

		// Top and bottom rows.
		const topLeft = isBitSet(holeMetadata, 7);
		const topRight = isBitSet(holeMetadata, 6);
		const bottomLeft = isBitSet(holeMetadata, 5);
		const bottomRight = isBitSet(holeMetadata, 4);
		for (let x = 0; x < levelWidth; ++x) {
			level.tiles[x] = true;
			level.tiles[(levelHeight - 1) * levelWidth + x] = true;
		}
		// Cut out the holes.
		for (let x = 0; x < 4; ++x) {
			if (topLeft) {
				level.tiles[9 + x] = false;
			}
			if (topRight) {
				level.tiles[19 + x] = false;
			}
			if (bottomLeft) {
				level.tiles[768 + 9 + x] = false;
			}
			if (bottomRight) {
				level.tiles[768 + 19 + x] = false;
			}
		}

		const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);

		if (!isBitSet(symmetryMetadata, 1)) {
			level.sidebarChars = [
				readCharsetChar(getByte, currentSidebarAddress + 0 * 8),
				readCharsetChar(getByte, currentSidebarAddress + 1 * 8),
				readCharsetChar(getByte, currentSidebarAddress + 2 * 8),
				readCharsetChar(getByte, currentSidebarAddress + 3 * 8),
			];
			currentSidebarAddress += 4 * 8; // 4 chars of 8 bytes each.
		}

		const isSymmetric = isBitSet(symmetryMetadata, 0);

		readTileBitmap(curentBitmapByteAddress, getByte, level, isSymmetric);
		curentBitmapByteAddress += (isSymmetric ? 2 : 4) * 23; // 23 lines of 2 or 4 bytes.

		// Fill in the sides.
		fillInTileBitmapSides(level);

		levels.push(level);
	}

	return levels;
}

function fillInTileBitmapSides(level: Level) {
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Offset by 32 for the top line.
		level.tiles[32 + rowIndex * levelWidth] = true;
		level.tiles[32 + rowIndex * levelWidth + 1] = true;
		level.tiles[32 + (rowIndex + 1) * levelWidth - 2] = true;
		level.tiles[32 + (rowIndex + 1) * levelWidth - 1] = true;
	}
}

function readTileBitmap(
	curentBitmapByteAddress: number,
	getByte: (address: number) => number,
	level: Level,
	isSymmetric: boolean
) {
	const bytesPerRow = 4;
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Read half or full lines from the level data.
		const bytesToRead = isSymmetric ? bytesPerRow / 2 : bytesPerRow;
		for (
			let bitmapByteOfRowIndex = 0;
			bitmapByteOfRowIndex < bytesToRead;
			++bitmapByteOfRowIndex
		) {
			const bitmapByteIndex = rowIndex * bytesPerRow + bitmapByteOfRowIndex;
			const bitmapByte = getByte(curentBitmapByteAddress);
			curentBitmapByteAddress += 1;
			// Convert the bitmap to an array of bools.
			for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
				// Offset by 32 for the top line.
				level.tiles[32 + bitmapByteIndex * 8 + bitIndex] = isBitSet(
					bitmapByte,
					bitIndex
				);
			}
		}
		if (isSymmetric) {
			// Mirror the left half to the right half.
			// Offset by 32 for the top line.
			const tileRowStartIndex = 32 + rowIndex * bytesPerRow * 8;
			const tilesPerHalfRow = (bytesPerRow / 2) * 8;
			for (
				let halfRowIndex = 0;
				halfRowIndex < tilesPerHalfRow;
				++halfRowIndex
			) {
				level.tiles[tileRowStartIndex + tilesPerHalfRow + halfRowIndex] =
					level.tiles[tileRowStartIndex + tilesPerHalfRow - halfRowIndex - 1];
			}
		}
	}
}
