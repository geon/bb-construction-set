import { expect, test } from "vitest";
import {
	encodeFirstByte,
	parseFirstByte,
	writeBubbleCurrentRectanglesForLevel,
	readBubbleCurrentRectangles,
	readBubbleCurrentRectanglesForLevel,
} from "../prg/bubble-current-rectangles";
import { getDataSegments } from "../prg/io";
import { readFileSync } from "fs";
import { ReadonlyUint8Array } from "../prg/types";

test("readBubbleCurrentRectangles snapshot", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer
	);

	const rectsFromPrg = readBubbleCurrentRectangles(dataSegments.windCurrents);

	expect(rectsFromPrg).toMatchSnapshot();
});

test("parseFirstByte", () => {
	expect(parseFirstByte(0b10000000 | 5)).toStrictEqual({
		type: "copy",
		levelIndex: 5,
		byteCount: 1,
	});
	expect(parseFirstByte(5)).toStrictEqual({
		type: "rectangles",
		byteCount: 5,
	});
});

test("encodeFirstByte", () => {
	expect(
		encodeFirstByte({
			type: "copy",
			levelIndex: 5,
			byteCount: 1,
		})
	).toStrictEqual(0b10000000 | 5);
	expect(
		encodeFirstByte({
			type: "rectangles",
			byteCount: 5,
		})
	).toStrictEqual(5);
});

test("readBubbleCurrentRectanglesForLevel & patchBubbleCurrentRectanglesForLevel", () => {
	// Sample data from level 3.
	const oneLevelData: ReadonlyUint8Array = new Uint8Array([
		20, 128, 26, 128, 128, 33, 15, 142, 136, 70, 207, 8, 6, 143, 64, 5, 142, 80,
		4, 0,
	]);

	const firstByte = parseFirstByte(oneLevelData[0]);
	const rects = readBubbleCurrentRectanglesForLevel(
		firstByte,
		oneLevelData.subarray(0, 0 + firstByte.byteCount)
	);

	const patched = new Uint8Array(oneLevelData.byteLength);
	patched[0] = encodeFirstByte(firstByte);
	patched
		.subarray(1)
		.set(writeBubbleCurrentRectanglesForLevel(firstByte, rects));

	expect(patched).toStrictEqual(oneLevelData);
});
