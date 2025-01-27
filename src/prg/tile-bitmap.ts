import { isBitSet, mirrorBits } from "./bit-twiddling";
import { GetBoundedByte } from "./io";

export function readTileBitmaps(
	getBitmapByte: GetBoundedByte,
	getSymmetryMetadataByte: GetBoundedByte
): number[][][] {
	const tileBitmaps = [];

	let offset = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const isSymmetric = isBitSet(getSymmetryMetadataByte(levelIndex), 0);
		tileBitmaps.push(readTileBitmap(offset, isSymmetric, getBitmapByte));
		offset += isSymmetric ? 46 : 92;
	}

	return tileBitmaps;
}

function readTileBitmap(
	offset: number,
	isSymmetric: boolean,
	getBitmapByte: GetBoundedByte
) {
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
