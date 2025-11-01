import {
	createPlatformTiles,
	PlatformTiles,
	platformTilesSize,
} from "../internal-data-formats/level";
import { byteToBits } from "../bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { assertTuple, Tuple } from "../tuple";

export function readTiles(
	tileBitmaps: Tuple<TileBitmap, 100>
): Tuple<PlatformTiles, 100> {
	const tilesForAllLevels: PlatformTiles[] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const tiles = createPlatformTiles();

		const tileBitmap = tileBitmaps[levelIndex]!;

		for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
			const bytesRow = tileBitmap.bytes[rowIndex]!;
			const rowTuple = getTilesRow(bytesRow);
			tiles[rowIndex] = rowTuple;
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

function getTilesRow(bytesRow: Tuple<number, 4>) {
	const bytesPerRow = 4;
	const row: boolean[] = [];
	// Read half or full lines from the level data.
	for (
		let bitmapByteOfRowIndex = 0;
		bitmapByteOfRowIndex < bytesPerRow;
		++bitmapByteOfRowIndex
	) {
		const bitmapByte = bytesRow[bitmapByteOfRowIndex]!;
		// Convert the bitmap to an array of bools.
		const bits = byteToBits(bitmapByte);
		for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
			row[bitmapByteOfRowIndex * 8 + bitIndex] = bits[bitIndex]!;
		}
	}
	const rowTuple = assertTuple(row, 32);
	return rowTuple;
}
