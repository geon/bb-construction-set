import {
	BubbleCurrentDirection,
	BubbleCurrentPerLineDefaults,
} from "../internal-data-formats/level";
import { isBitSet } from "../bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { ReadonlyUint8Array } from "../types";
import { assertTuple, Tuple } from "../tuple";

export function readBubbleCurrentPerLineDefaults(
	bubbleCurrentInHolesBytes: ReadonlyUint8Array,
	tileBitmaps: readonly TileBitmap[]
): Tuple<BubbleCurrentPerLineDefaults, 100> {
	const monstersForAllLevels = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		monstersForAllLevels.push(
			readBubbleCurrentPerLineDefaultsForLevel(
				levelIndex,
				tileBitmaps[levelIndex]!,
				bubbleCurrentInHolesBytes
			)
		);
	}

	return assertTuple(monstersForAllLevels, 100);
}

function readBubbleCurrentPerLineDefaultsForLevel(
	levelIndex: number,
	tileBitmap: TileBitmap,
	bubbleCurrentInHolesBytes: ReadonlyUint8Array
): BubbleCurrentPerLineDefaults {
	const bubbleCurrentInHoles = bubbleCurrentInHolesBytes[levelIndex]!;
	const perLineDefaults = extractbubbleCurrentLineDefault(
		tileBitmap,
		bubbleCurrentInHoles
	);

	return perLineDefaults;
}

function extractbubbleCurrentLineDefault(
	tileBitmap: TileBitmap,
	bubbleCurrentInHoles: number
): BubbleCurrentPerLineDefaults {
	return [
		((bubbleCurrentInHoles & 0b00110000) >> 4) as BubbleCurrentDirection,
		...tileBitmap.bytes.map((row) =>
			bitsToBubbleCurrentDirection([isBitSet(row[3], 6), isBitSet(row[3], 7)])
		),
		((bubbleCurrentInHoles & 0b11000000) >> 6) as BubbleCurrentDirection,
	];
}

function bitsToBubbleCurrentDirection(
	bits: [boolean, boolean]
): BubbleCurrentDirection {
	return ((bits[1] ? 1 : 0) + (bits[0] ? 1 : 0) * 2) as BubbleCurrentDirection;
}
