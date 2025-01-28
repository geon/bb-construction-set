import {
	BubbleCurrents,
	BubbleCurrentRectangleOrSymmetry,
	BubbleCurrentRectangle,
	BubbleCurrentDirection,
} from "../level";
import { isBitSet } from "./bit-twiddling";
import { TileBitmap } from "./tile-bitmap";
import { ReadonlyDataView } from "./types";

export function readBubbleCurrentRectangles(
	bubbleCurrentRectangleBytes: ReadonlyDataView,
	holeMetadataBytes: ReadonlyDataView,
	tileBitmaps: readonly TileBitmap[]
): BubbleCurrents[] {
	const monstersForAllLevels = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		monstersForAllLevels.push(
			readBubbleCurrentRectanglesForLevel(
				levelIndex,
				tileBitmaps[levelIndex],
				bubbleCurrentRectangleBytes,
				holeMetadataBytes
			)
		);
	}

	return monstersForAllLevels;
}

// Bytes are within [square brackets].
// Values are separated | with | pipes.
//
// For each rectangle:
//
// [NotSure | Count]
// [a bbbbbbb]

function readBubbleCurrentRectanglesForLevel(
	levelIndex: number,
	tileBitmap: TileBitmap,
	bubbleCurrentRectangleBytes: ReadonlyDataView,
	holeMetadataBytes: ReadonlyDataView
): BubbleCurrents {
	const holeMetadata = holeMetadataBytes.getUint8(levelIndex);
	const perLineDefaults = extractbubbleCurrentLineDefault(
		tileBitmap,
		holeMetadata
	);

	let currentWindCurrentsByteIndex = 0;
	for (let index = 0; index < levelIndex; ++index) {
		const firstByte = bubbleCurrentRectangleBytes.getUint8(
			currentWindCurrentsByteIndex
		);
		const firstByteWithoutCopyFlag = firstByte & 0b01111111;
		const byteCount = Math.max(1, firstByteWithoutCopyFlag);
		currentWindCurrentsByteIndex += byteCount;
	}

	const startingWindCurrentsAddress = currentWindCurrentsByteIndex;

	const firstByte = bubbleCurrentRectangleBytes.getUint8(
		currentWindCurrentsByteIndex++
	);
	const copy = isBitSet(firstByte, 0);
	const firstByteWithoutCopyFlag = firstByte & 0b01111111;

	if (copy) {
		return {
			type: "copy",
			levelIndex: firstByteWithoutCopyFlag,
			perLineDefaults,
		};
	}

	const byteCount = Math.max(1, firstByteWithoutCopyFlag);

	if (!byteCount) {
		return {
			type: "rectangles",
			rectangles: [],
			perLineDefaults,
		};
	}

	const rectangles: BubbleCurrentRectangleOrSymmetry[] = [];
	while (
		currentWindCurrentsByteIndex - startingWindCurrentsAddress <
		byteCount
	) {
		const firstByte = bubbleCurrentRectangleBytes.getUint8(
			currentWindCurrentsByteIndex++
		);
		const symmetry = !isBitSet(firstByte, 0);
		if (symmetry) {
			rectangles.push({
				type: "symmetry",
			});

			continue;
		}

		rectangles.push({
			type: "rectangle",
			...bytesToBubbleCurrentRectangle([
				firstByte,
				bubbleCurrentRectangleBytes.getUint8(currentWindCurrentsByteIndex++),
				bubbleCurrentRectangleBytes.getUint8(currentWindCurrentsByteIndex++),
			]),
		});
	}

	return {
		type: "rectangles",
		rectangles,
		perLineDefaults,
	};
}

export function bytesToBubbleCurrentRectangle(
	bytes: [number, number, number]
): BubbleCurrentRectangle {
	// Bytes are within [square brackets].
	// Values are separated | with | pipes.
	// [Skip | Direction | Left] | [Top | Wid][th | Unused | Height]
	// [a  bb ccccc] [ddddd eee][ee f ggggg]
	const direction = ((bytes[0] & 0b01100000) >> 5) as BubbleCurrentDirection;
	const left = bytes[0] & 0b00011111;
	const top = (bytes[1] & 0b11111000) >> 3;
	const width =
		(((bytes[1] & 0b00000111) << 2) | ((bytes[2] & 0b11000000) >> 6)) + 1;
	const height = (bytes[2] & 0b00011111) + 1;

	return {
		left,
		top,
		width,
		height,
		direction,
	};
}

export function bubbleCurrentRectangleToBytes(
	rectangle: BubbleCurrentRectangle
): [number, number, number] {
	const bytes: [number, number, number] = [0, 0, 0];

	// const direction = ((bytes[0] & 0b01100000) >> 5) as BubbleCurrentDirection;
	// const left = bytes[0] & 0b00011111;
	// const top = (bytes[1] & 0b11111000) >> 3;
	// const width = ((bytes[1] & 0b00000111) << 2) | ((bytes[2] & 0b11000000) >> 6);
	// const height = bytes[2] & 0b00011111;
	bytes[0] = (rectangle.direction << 5) | rectangle.left;
	bytes[1] = (rectangle.top << 3) | ((rectangle.width - 1) >> 2);
	bytes[2] =
		(((rectangle.width - 1) << 6) & 0b11000000) | (rectangle.height - 1);
	return bytes;
}

function extractbubbleCurrentLineDefault(
	tileBitmap: TileBitmap,
	holeMetadata: number
): Array<BubbleCurrentDirection> {
	return [
		((holeMetadata & 0b00110000) >> 4) as BubbleCurrentDirection,
		...tileBitmap.map((row) =>
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
