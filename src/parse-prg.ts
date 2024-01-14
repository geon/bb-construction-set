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
	const bgColorMetadataArrayAddress = 0xff30;
	const holeMetadataArrayAddress = 0xc58e;
	const symmetryMetadataArrayAddress = 0xff94;
	const bitmapArrayAddress = 0xc5f2;

	// TODO: Check the original data size, and verify.
	const levels: Array<Level> = [];
	let curentBitmapByteAddress = bitmapArrayAddress;
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
		for (let x = 0; x < levelWidth; ++x) {
			level.tiles[x] = true;
			level.tiles[(levelHeight - 1) * levelWidth + x] = true;
		}
		// Cut out the holes.
		for (let x = 0; x < 4; ++x) {
			if (isBitSet(holeMetadata, 7)) {
				level.tiles[9 + x] = false;
			}
			if (isBitSet(holeMetadata, 6)) {
				level.tiles[19 + x] = false;
			}
			if (isBitSet(holeMetadata, 5)) {
				level.tiles[768 + 9 + x] = false;
			}
			if (isBitSet(holeMetadata, 4)) {
				level.tiles[768 + 19 + x] = false;
			}
		}

		const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);
		const isSymmetric = isBitSet(symmetryMetadata, 0);
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

			// Fill in the sides.
			// Offset by 32 for the top line.
			level.tiles[32 + rowIndex * levelWidth] = true;
			level.tiles[32 + rowIndex * levelWidth + 1] = true;
			level.tiles[32 + (rowIndex + 1) * levelWidth - 2] = true;
			level.tiles[32 + (rowIndex + 1) * levelWidth - 1] = true;
		}

		levels.push(level);
	}

	return levels;
}
