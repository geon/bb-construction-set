import { expect, test } from "vitest";
import {
	encodeFirstByte,
	parseFirstByte,
	readBubbleCurrentRectangles,
	readBubbleCurrentRectanglesForLevel,
} from "../prg/bubble-current-rectangles";
import { dataViewSlice, getDataSegments } from "../prg/io";
import { readFileSync } from "fs";

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

test("readBubbleCurrentRectanglesForLevel snapshot", () => {
	// Sample data from level 3.
	const oneLevelData = new DataView(
		new Uint8Array([
			20, 128, 26, 128, 128, 33, 15, 142, 136, 70, 207, 8, 6, 143, 64, 5, 142,
			80, 4, 0,
		]).buffer
	);

	const firstByte = parseFirstByte(oneLevelData.getUint8(0));
	const rects = readBubbleCurrentRectanglesForLevel(
		firstByte,
		dataViewSlice(oneLevelData, 1, firstByte.byteCount - 1)
	);

	expect(rects).toMatchSnapshot();
});
