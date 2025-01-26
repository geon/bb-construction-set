import {
	PerLineBubbleCurrentDefaults,
	BubbleCurrents,
	BubbleCurrentRectangleOrSymmetry,
	BubbleCurrentRectangle,
	BubbleCurrentDirection,
} from "../level";
import { isBitSet } from "./bit-twiddling";
import { windCurrentsArrayAddress } from "./data-locations";
import { GetByte } from "./types";

// Bytes are within [square brackets].
// Values are separated | with | pipes.
//
// For each rectangle:
//
// [NotSure | Count]
// [a bbbbbbb]

export function readBubbleCurrentRectangles(
	levelIndex: number,
	getByte: GetByte,
	perLineDefaults: PerLineBubbleCurrentDefaults
): BubbleCurrents {
	let currentWindCurrentsAddress = windCurrentsArrayAddress;
	for (let index = 0; index < levelIndex; ++index) {
		const firstByte = getByte(currentWindCurrentsAddress);
		const firstByteWithoutCopyFlag = firstByte & 0b01111111;
		const byteCount = Math.max(1, firstByteWithoutCopyFlag);
		currentWindCurrentsAddress += byteCount;
	}

	const startingWindCurrentsAddress = currentWindCurrentsAddress;

	const firstByte = getByte(currentWindCurrentsAddress++);
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
	while (currentWindCurrentsAddress - startingWindCurrentsAddress < byteCount) {
		const firstByte = getByte(currentWindCurrentsAddress++);
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
				getByte(currentWindCurrentsAddress++),
				getByte(currentWindCurrentsAddress++),
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
