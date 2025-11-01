import { platformTilesSize } from "../internal-data-formats/level";
import { byteToBits } from "../bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { assertTuple, Tuple } from "../tuple";
import { Tiles, createTiles } from "../internal-data-formats/tiles";

export function readTiles(
	tileBitmaps: Tuple<TileBitmap, 100>
): Tuple<Tiles, 100> {
	const tilesForAllLevels: Tiles[] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const tiles = createTiles();

		// Fill in top and bottom row.
		for (let x = 0; x < platformTilesSize.x; ++x) {
			tiles[0]![x]! = true;
			tiles[platformTilesSize.y - 1]![x]! = true;
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
		for (let rowIndex = 0; rowIndex < platformTilesSize.y; ++rowIndex) {
			tiles[rowIndex]![0]! = true;
			tiles[rowIndex]![1]! = true;
			tiles[rowIndex]![platformTilesSize.x - 2]! = true;
			tiles[rowIndex]![platformTilesSize.x - 1]! = true;
		}

		tilesForAllLevels.push(tiles);
	}

	return assertTuple(tilesForAllLevels, 100);
}
