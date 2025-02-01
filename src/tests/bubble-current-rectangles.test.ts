import { expect, test } from "vitest";
import {
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
