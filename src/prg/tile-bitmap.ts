import { sum } from "../functions";
import { isBitSet, mirrorBits } from "./bit-twiddling";
import { symmetryMetadataArrayAddress } from "./data-locations";
import { GetBoundedByte, getBytes } from "./io";
import { GetByte } from "./types";

export function readTileBitmaps(
	getBitmapByte: GetBoundedByte,
	getByte: GetByte
): number[][][] {
	const tileBitmaps = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		tileBitmaps.push(readTileBitmap(levelIndex, getBitmapByte, getByte));
	}

	return tileBitmaps;
}

function readTileBitmap(
	levelIndex: number,
	getBitmapByte: GetBoundedByte,
	getByte: GetByte
) {
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
	let currentBitmapByteIndex = offset;
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
			bitmapBytes.push(getBitmapByte(currentBitmapByteIndex));
			currentBitmapByteIndex += 1;
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
