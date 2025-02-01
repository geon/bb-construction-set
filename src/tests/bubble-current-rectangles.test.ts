import { expect, test } from "vitest";
import {
	encodeFirstByte,
	parseFirstByte,
	readBubbleCurrentRectangles,
} from "../prg/bubble-current-rectangles";
import { getDataSegments } from "../prg/io";
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
