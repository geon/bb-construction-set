import { expect, test } from "vitest";
import {
	encodeFirstByte,
	parseFirstByte,
	writeBubbleCurrentRectanglesForLevel,
	readBubbleCurrentRectangles,
	readBubbleCurrentRectanglesForLevel,
	writeBubbleCurrentRectangles,
} from "../bubble-current-rectangles";
import { getDataSegments } from "../io";
import { readFileSync } from "fs";
import { ReadonlyUint8Array } from "../../types";
import { levelSegmentLocations } from "../data-locations";

test("readBubbleCurrentRectangles snapshot", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer,
		levelSegmentLocations,
	);

	const rectsFromPrg = readBubbleCurrentRectangles(
		dataSegments.windCurrents.buffer,
	);

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
		}),
	).toStrictEqual(0b10000000 | 5);
	expect(
		encodeFirstByte({
			type: "rectangles",
			byteCount: 5,
		}),
	).toStrictEqual(5);
});

test("readBubbleCurrentRectanglesForLevel & patchBubbleCurrentRectanglesForLevel", () => {
	// Sample data from level 3.
	const oneLevelData: ReadonlyUint8Array = new Uint8Array([
		20, 128, 26, 128, 128, 33, 15, 142, 136, 70, 207, 8, 6, 143, 64, 5, 142, 80,
		4, 0,
	]);

	const rects = readBubbleCurrentRectanglesForLevel(oneLevelData);

	const patched = writeBubbleCurrentRectanglesForLevel(rects);

	expect(patched).toStrictEqual(oneLevelData);
});

test("readBubbleCurrentRectangles & writeBubbleCurrentRectangles", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer,
		levelSegmentLocations,
	);

	const rects = readBubbleCurrentRectangles(dataSegments.windCurrents.buffer);

	const patched = writeBubbleCurrentRectangles(rects);

	expect(patched).toStrictEqual(dataSegments.windCurrents.buffer);
});
