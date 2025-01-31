import {
	BubbleCurrentRectangles,
	BubbleCurrentRectangleOrSymmetry,
	BubbleCurrentRectangle,
	BubbleCurrentDirection,
} from "../level";
import { isBitSet } from "./bit-twiddling";
import { ReadonlyDataView } from "./types";

export function readBubbleCurrentRectangles(
	bubbleCurrentRectangleBytes: ReadonlyDataView
): BubbleCurrentRectangles[] {
	const monstersForAllLevels = [];

	let currentWindCurrentsByteIndex = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const firstByte = bubbleCurrentRectangleBytes.getUint8(
			currentWindCurrentsByteIndex
		);
		const copy = isBitSet(firstByte, 0);
		const firstByteWithoutCopyFlag = firstByte & 0b01111111;
		const byteCount = copy ? 1 : Math.max(1, firstByteWithoutCopyFlag);

		monstersForAllLevels.push(
			readBubbleCurrentRectanglesForLevel(
				currentWindCurrentsByteIndex,
				bubbleCurrentRectangleBytes
			)
		);

		currentWindCurrentsByteIndex += byteCount;
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
	currentWindCurrentsByteIndex: number,
	bubbleCurrentRectangleBytes: ReadonlyDataView
): BubbleCurrentRectangles {
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
		};
	}

	const byteCount = Math.max(1, firstByteWithoutCopyFlag);

	if (!byteCount) {
		return {
			type: "rectangles",
			rectangles: [],
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
