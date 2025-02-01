import {
	BubbleCurrentRectangles,
	BubbleCurrentRectangleOrSymmetry,
	BubbleCurrentRectangle,
	BubbleCurrentDirection,
} from "../level";
import { isBitSet } from "./bit-twiddling";
import { dataViewSlice } from "./io";
import { ReadonlyDataView } from "./types";

export function readBubbleCurrentRectangles(
	bubbleCurrentRectangleBytes: ReadonlyDataView
): BubbleCurrentRectangles[] {
	const bubbleCurrentRectanglesForAllLevels: BubbleCurrentRectangles[] = [];

	let currentWindCurrentsByteIndex = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const firstByte = parseFirstByte(
			bubbleCurrentRectangleBytes.getUint8(currentWindCurrentsByteIndex)
		);

		bubbleCurrentRectanglesForAllLevels.push(
			readBubbleCurrentRectanglesForLevel(
				firstByte,
				dataViewSlice(
					bubbleCurrentRectangleBytes,
					currentWindCurrentsByteIndex + 1,
					firstByte.byteCount - 1
				)
			)
		);

		currentWindCurrentsByteIndex += firstByte.byteCount;
	}

	return bubbleCurrentRectanglesForAllLevels;
}

type FirstByte = {
	byteCount: number;
} & (
	| {
			type: "copy";
			levelIndex: number;
	  }
	| {
			type: "rectangles";
	  }
);

export function parseFirstByte(firstByte: number): FirstByte {
	const copy = isBitSet(firstByte, 0);
	const firstByteWithoutCopyFlag = firstByte & 0b01111111;

	return copy
		? {
				type: "copy",
				levelIndex: firstByteWithoutCopyFlag,
				byteCount: 1,
		  }
		: {
				type: "rectangles",
				byteCount: Math.max(1, firstByteWithoutCopyFlag),
		  };
}

// Bytes are within [square brackets].
// Values are separated | with | pipes.
//
// For each rectangle:
//
// [NotSure | Count]
// [a bbbbbbb]

function readBubbleCurrentRectanglesForLevel(
	firstByte: FirstByte,
	bubbleCurrentRectangleBytes: ReadonlyDataView
): BubbleCurrentRectangles {
	if (firstByte.type === "copy") {
		return {
			type: "copy",
			levelIndex: firstByte.levelIndex,
		};
	}

	let currentWindCurrentsByteIndex = 0;

	const rectangles: BubbleCurrentRectangleOrSymmetry[] = [];
	while (
		currentWindCurrentsByteIndex < bubbleCurrentRectangleBytes.byteLength
	) {
		const firstByte = bubbleCurrentRectangleBytes.getUint8(
			currentWindCurrentsByteIndex
		);
		const symmetry = !isBitSet(firstByte, 0);

		rectangles.push(
			symmetry
				? {
						type: "symmetry",
				  }
				: {
						type: "rectangle",
						...bytesToBubbleCurrentRectangle(
							dataViewSlice(
								bubbleCurrentRectangleBytes,
								currentWindCurrentsByteIndex,
								3
							)
						),
				  }
		);

		currentWindCurrentsByteIndex += symmetry ? 1 : 3;
	}

	return {
		type: "rectangles",
		rectangles,
	};
}

export function bytesToBubbleCurrentRectangle(
	dataView: ReadonlyDataView
): BubbleCurrentRectangle {
	const bytes = [
		dataView.getUint8(0),
		dataView.getUint8(1),
		dataView.getUint8(2),
	];

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
): DataView {
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
	return new DataView(new Uint8Array(bytes).buffer);
}

export function encodeFirstByte(firstByte: FirstByte): number {
	return firstByte.type === "copy"
		? 0b10000000 | firstByte.levelIndex
		: firstByte.byteCount;
}
