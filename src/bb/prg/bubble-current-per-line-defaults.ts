import {
	BubbleCurrentDirection,
	BubbleCurrentPerLineDefaults,
} from "../internal-data-formats/level";
import { isBitSet } from "../bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { ReadonlyUint8Array } from "../types";

export function readBubbleCurrentPerLineDefaults(
	holeMetadataBytes: ReadonlyUint8Array,
	tileBitmaps: readonly TileBitmap[]
): BubbleCurrentPerLineDefaults[] {
	const monstersForAllLevels = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		monstersForAllLevels.push(
			readBubbleCurrentPerLineDefaultsForLevel(
				levelIndex,
				tileBitmaps[levelIndex]!,
				holeMetadataBytes
			)
		);
	}

	return monstersForAllLevels;
}

function readBubbleCurrentPerLineDefaultsForLevel(
	levelIndex: number,
	tileBitmap: TileBitmap,
	holeMetadataBytes: ReadonlyUint8Array
): BubbleCurrentPerLineDefaults {
	const holeMetadata = holeMetadataBytes[levelIndex]!;
	const perLineDefaults = extractbubbleCurrentLineDefault(
		tileBitmap,
		holeMetadata
	);

	return perLineDefaults;
}

function extractbubbleCurrentLineDefault(
	tileBitmap: TileBitmap,
	holeMetadata: number
): Array<BubbleCurrentDirection> {
	return [
		((holeMetadata & 0b00110000) >> 4) as BubbleCurrentDirection,
		...tileBitmap.bytes.map((row) =>
			bitsToBubbleCurrentDirection([isBitSet(row[3], 6), isBitSet(row[3], 7)])
		),
		((holeMetadata & 0b11000000) >> 6) as BubbleCurrentDirection,
	];
}

function bitsToBubbleCurrentDirection(
	bits: [boolean, boolean]
): BubbleCurrentDirection {
	return ((bits[1] ? 1 : 0) + (bits[0] ? 1 : 0) * 2) as BubbleCurrentDirection;
}
