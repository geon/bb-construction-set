import { sum } from "../functions";
import { isBitSet, mirrorBits } from "./bit-twiddling";
import {
	symmetryMetadataArrayAddress,
	bitmapArrayAddress,
} from "./data-locations";
import { getBytes } from "./io";
import { GetByte } from "./types";

export function readTileBitmap(levelIndex: number, getByte: GetByte) {
	const symmetryMetadata = getBytes(getByte, symmetryMetadataArrayAddress, 100);
	const isSymmetric = isBitSet(symmetryMetadata[levelIndex], 0);

	const offset = sum(
		symmetryMetadata
			.slice(0, levelIndex)
			// Skip 46 or 92 bytes per level depending on if it is symmetric or not.
			.map((byte) => (isBitSet(byte, 0) ? 46 : 92))
	);

	const bytesPerRow = 4;

	// Read tile bitmap.
	let currentBitmapByteAddress = bitmapArrayAddress + offset;
	const bitmapBytesRows = [];
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Read half or full lines from the level data.
		const bytesToRead = isSymmetric ? bytesPerRow / 2 : bytesPerRow;
		const bitmapBytes = [];
		for (
			let bitmapByteOfRowIndex = 0;
			bitmapByteOfRowIndex < bytesToRead;
			++bitmapByteOfRowIndex
		) {
			bitmapBytes.push(getByte(currentBitmapByteAddress));
			currentBitmapByteAddress += 1;
		}

		if (isSymmetric) {
			// Mirror the left half to the right half.
			for (
				let halfRowIndex = 0;
				halfRowIndex < bytesPerRow / 2;
				++halfRowIndex
			) {
				bitmapBytes[bytesPerRow / 2 + halfRowIndex] = mirrorBits(
					bitmapBytes[bytesPerRow / 2 - halfRowIndex - 1]
				);
			}
		}

		bitmapBytesRows.push(bitmapBytes);
	}
	return bitmapBytesRows;
}
