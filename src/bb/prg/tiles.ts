import {
	createTiles,
	levelTilesSize,
	Tiles,
} from "../internal-data-formats/level";
import { byteToBits, isBitSet } from "../bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { ReadonlyUint8Array } from "../types";
import { assertTuple, Tuple } from "../tuple";

export function readTiles(
	holeMetadataBytes: ReadonlyUint8Array,
	tileBitmaps: Tuple<TileBitmap, 100>
): Tuple<Tiles, 100> {
	const tilesForAllLevels: Tiles[] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const tiles = createTiles();

		// Fill in top and bottom row.
		for (let x = 0; x < levelTilesSize.x; ++x) {
			tiles[0]![x]! = true;
			tiles[levelTilesSize.y - 1]![x]! = true;
		}
		// Cut out the holes.
		const holeMetadata = holeMetadataBytes[levelIndex]!;
		const holes = {
			top: {
				left: isBitSet(holeMetadata, 7),
				right: isBitSet(holeMetadata, 6),
			},
			bottom: {
				left: isBitSet(holeMetadata, 5),
				right: isBitSet(holeMetadata, 4),
			},
		};
		for (let x = 0; x < 4; ++x) {
			if (holes.top.left) {
				tiles[0]![9 + x]! = false;
			}
			if (holes.top.right) {
				tiles[0]![19 + x]! = false;
			}
			if (holes.bottom.left) {
				tiles[24]![9 + x]! = false;
			}
			if (holes.bottom.right) {
				tiles[24]![19 + x]! = false;
			}
		}

		const tileBitmap = tileBitmaps[levelIndex]!;

		const bytesPerRow = 4;
		for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
			// Read half or full lines from the level data.
			for (
				let bitmapByteOfRowIndex = 0;
				bitmapByteOfRowIndex < bytesPerRow;
				++bitmapByteOfRowIndex
			) {
				const bitmapByte = tileBitmap.bytes[rowIndex]![bitmapByteOfRowIndex]!;
				// Convert the bitmap to an array of bools.
				const bits = byteToBits(bitmapByte);
				for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
					// Offset by 32 for the top line.
					tiles[rowIndex + 1]![bitmapByteOfRowIndex * 8 + bitIndex]! =
						bits[bitIndex]!;
				}
			}
		}

		// Fill in the sides.
		// The 2 tile wide left and right borders are used to store part of the bubbleCurrent.
		// It needs to be set to true to be solid.
		for (let rowIndex = 0; rowIndex < levelTilesSize.y; ++rowIndex) {
			tiles[rowIndex]![0]! = true;
			tiles[rowIndex]![1]! = true;
			tiles[rowIndex]![levelTilesSize.x - 2]! = true;
			tiles[rowIndex]![levelTilesSize.x - 1]! = true;
		}

		tilesForAllLevels.push(tiles);
	}

	return assertTuple(tilesForAllLevels, 100);
}
