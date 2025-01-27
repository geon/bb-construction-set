import {
	createTiles,
	levelWidth,
	levelHeight,
	Tiles,
	BubbleCurrentDirection,
} from "../level";
import { byteToBits, isBitSet } from "./bit-twiddling";
import { holeMetadataArrayAddress } from "./data-locations";
import { GetByte } from "./types";

export function readTilesAndBubbleCurrentLineDefault(
	getByte: GetByte,
	tileBitmaps: number[][][]
) {
	const tilesForAllLevels: Tiles[] = [];
	const bubbleCurrentLineDefaultForAllLevels: BubbleCurrentDirection[][] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const tiles = createTiles();

		// Fill in top and bottom row.
		for (let x = 0; x < levelWidth; ++x) {
			tiles[0][x] = true;
			tiles[levelHeight - 1][x] = true;
		}
		// Cut out the holes.
		const holeMetadata = getByte(holeMetadataArrayAddress + levelIndex);
		const topLeft = isBitSet(holeMetadata, 7);
		const topRight = isBitSet(holeMetadata, 6);
		const bottomLeft = isBitSet(holeMetadata, 5);
		const bottomRight = isBitSet(holeMetadata, 4);
		for (let x = 0; x < 4; ++x) {
			if (topLeft) {
				tiles[0][9 + x] = false;
			}
			if (topRight) {
				tiles[0][19 + x] = false;
			}
			if (bottomLeft) {
				tiles[24][9 + x] = false;
			}
			if (bottomRight) {
				tiles[24][19 + x] = false;
			}
		}

		const tileBitmap = tileBitmaps[levelIndex];

		const bytesPerRow = 4;
		for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
			// Read half or full lines from the level data.
			for (
				let bitmapByteOfRowIndex = 0;
				bitmapByteOfRowIndex < bytesPerRow;
				++bitmapByteOfRowIndex
			) {
				const bitmapByte = tileBitmap[rowIndex][bitmapByteOfRowIndex];
				// Convert the bitmap to an array of bools.
				const bits = byteToBits(bitmapByte);
				for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
					// Offset by 32 for the top line.
					tiles[rowIndex + 1][bitmapByteOfRowIndex * 8 + bitIndex] =
						bits[bitIndex];
				}
			}
		}

		const bubbleCurrentLineDefault = extractbubbleCurrentLineDefault(
			tiles,
			holeMetadata
		);

		bubbleCurrentLineDefaultForAllLevels.push(bubbleCurrentLineDefault);

		// Fill in the sides.
		// The 2 tile wide left and right borders are used to store part of the bubbleCurrent.
		// It needs to be set to true to be solid.
		for (let rowIndex = 0; rowIndex < 25; ++rowIndex) {
			tiles[rowIndex][0] = true;
			tiles[rowIndex][1] = true;
			tiles[rowIndex][levelWidth - 2] = true;
			tiles[rowIndex][levelWidth - 1] = true;
		}

		tilesForAllLevels.push(tiles);
	}

	return {
		tiles: tilesForAllLevels,
		bubbleCurrentLineDefault: bubbleCurrentLineDefaultForAllLevels,
	};
}

function extractbubbleCurrentLineDefault(
	tiles: Tiles,
	holeMetadata: number
): Array<BubbleCurrentDirection> {
	return [
		((holeMetadata & 0b00110000) >> 4) as BubbleCurrentDirection,
		...tiles
			.slice(1, 24)
			.map((row) =>
				bitsToBubbleCurrentDirection(
					row.slice(levelWidth - 2) as [boolean, boolean]
				)
			),
		((holeMetadata & 0b11000000) >> 6) as BubbleCurrentDirection,
	];
}

function bitsToBubbleCurrentDirection(
	bits: [boolean, boolean]
): BubbleCurrentDirection {
	return ((bits[1] ? 1 : 0) + (bits[0] ? 1 : 0) * 2) as BubbleCurrentDirection;
}
