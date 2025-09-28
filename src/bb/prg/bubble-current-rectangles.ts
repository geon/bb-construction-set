import { sum } from "../functions";
import {
	BubbleCurrentRectangles,
	BubbleCurrentRectangleOrSymmetry,
	BubbleCurrentRectangle,
	BubbleCurrentDirection,
} from "../internal-data-formats/level";
import { isBitSet } from "../bit-twiddling";
import { uint8ArrayConcatenate } from "./io";
import { ReadonlyUint8Array } from "../types";

export function readBubbleCurrentRectangles(
	bubbleCurrentRectangleBytes: ReadonlyUint8Array
): BubbleCurrentRectangles[] {
	const bubbleCurrentRectanglesForAllLevels: BubbleCurrentRectangles[] = [];

	let currentWindCurrentsByteIndex = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const firstByte = parseFirstByte(
			bubbleCurrentRectangleBytes[currentWindCurrentsByteIndex]!
		);

		bubbleCurrentRectanglesForAllLevels.push(
			readBubbleCurrentRectanglesForLevel(
				bubbleCurrentRectangleBytes.subarray(
					currentWindCurrentsByteIndex,
					currentWindCurrentsByteIndex + firstByte.byteCount
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

export function readBubbleCurrentRectanglesForLevel(
	bubbleCurrentRectangleBytes: ReadonlyUint8Array
): BubbleCurrentRectangles {
	const firstByte = parseFirstByte(bubbleCurrentRectangleBytes[0]!);

	if (firstByte.type === "copy") {
		return {
			type: "copy",
			levelIndex: firstByte.levelIndex,
		};
	}

	let currentWindCurrentsByteIndex = 1;

	const rectangles: BubbleCurrentRectangleOrSymmetry[] = [];
	while (
		currentWindCurrentsByteIndex < bubbleCurrentRectangleBytes.byteLength
	) {
		const firstByte =
			bubbleCurrentRectangleBytes[currentWindCurrentsByteIndex]!;
		const symmetry = !isBitSet(firstByte, 0);

		rectangles.push(
			symmetry
				? {
						type: "symmetry",
				  }
				: {
						type: "rectangle",
						...bytesToBubbleCurrentRectangle(
							bubbleCurrentRectangleBytes.subarray(
								currentWindCurrentsByteIndex,
								currentWindCurrentsByteIndex + 3
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

export function writeBubbleCurrentRectanglesForLevel(
	rectangles: BubbleCurrentRectangles
): Uint8Array {
	if (rectangles.type === "copy") {
		return new Uint8Array([
			encodeFirstByte({
				type: "copy",
				levelIndex: rectangles.levelIndex,
				// The byte count is of course 1, but the c64 data has 0, so just follow that.
				byteCount: 0,
			}),
		]);
	}

	const rectangleBytesArrays = rectangles.rectangles.map((rectangle) => {
		return rectangle.type === "symmetry"
			? new Uint8Array([0])
			: bubbleCurrentRectangleToBytes(rectangle);
	});
	return uint8ArrayConcatenate([
		new Uint8Array([
			encodeFirstByte({
				type: "rectangles",
				byteCount: 1 + sum(rectangleBytesArrays.map((x) => x.length)),
			}),
		]),
		...rectangleBytesArrays,
	]);
}

export function bytesToBubbleCurrentRectangle(
	bytes: ReadonlyUint8Array
): BubbleCurrentRectangle {
	// Bytes are within [square brackets].
	// Values are separated | with | pipes.
	// [Skip | Direction | Left] | [Top | Wid][th | Unused | Height]
	// [a  bb ccccc] [ddddd eee][ee f ggggg]
	const direction = ((bytes[0]! & 0b01100000) >> 5) as BubbleCurrentDirection;
	const left = bytes[0]! & 0b00011111;
	const top = (bytes[1]! & 0b11111000) >> 3;
	const width =
		(((bytes[1]! & 0b00000111) << 2) | ((bytes[2]! & 0b11000000) >> 6)) + 1;
	const height = (bytes[2]! & 0b00011111) + 1;

	return {
		rect: {
			pos: {
				x: left,
				y: top,
			},
			size: {
				x: width,
				y: height,
			},
		},
		direction,
	};
}

export function bubbleCurrentRectangleToBytes(
	rectangle: BubbleCurrentRectangle
): Uint8Array {
	const bytes: [number, number, number] = [0, 0, 0];

	// const direction = ((bytes[0] & 0b01100000) >> 5) as BubbleCurrentDirection;
	// const left = bytes[0] & 0b00011111;
	// const top = (bytes[1] & 0b11111000) >> 3;
	// const width = ((bytes[1] & 0b00000111) << 2) | ((bytes[2] & 0b11000000) >> 6);
	// const height = bytes[2] & 0b00011111;
	bytes[0] = 0b10000000 | (rectangle.direction << 5) | rectangle.rect.pos.x;
	bytes[1] = (rectangle.rect.pos.y << 3) | ((rectangle.rect.size.x - 1) >> 2);
	bytes[2] =
		(((rectangle.rect.size.x - 1) << 6) & 0b11000000) |
		(rectangle.rect.size.y - 1);
	return new Uint8Array(bytes);
}

export function encodeFirstByte(firstByte: FirstByte): number {
	return firstByte.type === "copy"
		? 0b10000000 | firstByte.levelIndex
		: firstByte.byteCount === 1
		? 0
		: firstByte.byteCount;
}

export function writeBubbleCurrentRectangles(
	bubbleCurrentses: readonly BubbleCurrentRectangles[]
): Uint8Array {
	return uint8ArrayConcatenate(
		bubbleCurrentses.map((bubbleCurrents) =>
			writeBubbleCurrentRectanglesForLevel(bubbleCurrents)
		)
	);
}
