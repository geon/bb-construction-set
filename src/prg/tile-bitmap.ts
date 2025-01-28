import { isBitSet, mirrorBits } from "./bit-twiddling";
import { dataViewSlice } from "./io";

export function readTileBitmaps(
	bitmapBytes: DataView,
	symmetryMetadataBytes: DataView
): number[][][] {
	const tileBitmaps = [];

	let offset = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const isSymmetric = isBitSet(symmetryMetadataBytes.getUint8(levelIndex), 0);
		const levelBitmapByteLength = isSymmetric ? 46 : 92;
		tileBitmaps.push(
			readTileBitmap(
				isSymmetric,
				dataViewSlice(bitmapBytes, offset, levelBitmapByteLength)
			)
		);
		offset += levelBitmapByteLength;
	}

	return tileBitmaps;
}

function readTileBitmap(isSymmetric: boolean, bitmapDataview: DataView) {
	const bytesPerRow = 4;

	// Read tile bitmap.
	let currentBitmapByteIndex = 0;
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
			bitmapBytes.push(bitmapDataview.getUint8(currentBitmapByteIndex));
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
