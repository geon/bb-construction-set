import {
	PlatformTiles,
	platformTilesSize,
} from "../internal-data-formats/level";
import { byteToBits } from "../bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { assertTuple, mapTuple, Tuple } from "../tuple";

export function readTiles(
	tileBitmaps: Tuple<TileBitmap, 100>,
): Tuple<PlatformTiles, 100> {
	const tilesForAllLevels: PlatformTiles[] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const tileBitmap = tileBitmaps[levelIndex]!;
		const tiles = mapTuple(tileBitmap.bytes, (byteRow) =>
			assertTuple(getTilesRow(byteRow).slice(2, -2), platformTilesSize.x),
		);

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
