import { isBitSet, mirrorBits } from "./bit-twiddling";
import { ReadonlyUint8Array } from "./types";

export type TileBitmap = {
	readonly isSymmetric: boolean;
	readonly bytes: readonly (readonly [number, number, number, number])[];
};

export function readTileBitmaps(
	bitmapBytes: ReadonlyUint8Array,
	symmetryMetadataBytes: ReadonlyUint8Array
): readonly TileBitmap[] {
	const tileBitmaps: TileBitmap[] = [];

	let offset = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const isSymmetric = isBitSet(symmetryMetadataBytes[levelIndex], 0);
		const levelBitmapByteLength = isSymmetric ? 46 : 92;
		tileBitmaps.push(
			readTileBitmap(
				isSymmetric,
				bitmapBytes.subarray(offset, offset + levelBitmapByteLength)
			)
		);
		offset += levelBitmapByteLength;
	}

	return tileBitmaps;
}

function readTileBitmap(
	isSymmetric: boolean,
	byteArray: ReadonlyUint8Array
): TileBitmap {
	const bytesPerRow = 4;

	// Read tile bitmap.
	let currentBitmapByteIndex = 0;
	const bitmapBytesRows: TileBitmap["bytes"][number][] = [];
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Read half or full lines from the level data.
		const bytesToRead = isSymmetric ? bytesPerRow / 2 : bytesPerRow;
		const bitmapBytes = [];
		for (
			let bitmapByteOfRowIndex = 0;
			bitmapByteOfRowIndex < bytesToRead;
			++bitmapByteOfRowIndex
		) {
			bitmapBytes.push(byteArray[currentBitmapByteIndex]);
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

		bitmapBytesRows.push(bitmapBytes as unknown as TileBitmap["bytes"][number]);
	}
	return {
		isSymmetric,
		bytes: bitmapBytesRows,
	};
}
