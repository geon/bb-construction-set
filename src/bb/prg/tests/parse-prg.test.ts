import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { parsePrg } from "../parse-prg";
import {
	bubbleCurrentRectangleToBytes,
	bytesToBubbleCurrentRectangle,
} from "../bubble-current-rectangles";
import { knownGoodBubbleCurrentRectsForLevels } from "./knownGoodBubbleCurrentRectsForLevels";

test("readBubbleCurrentRectangles", () => {
	const rectanglesOnly = knownGoodBubbleCurrentRectsForLevels
		.filter((rects) => rects.type === "rectangles")
		.flatMap((foo) =>
			foo.rectangles
				.filter((rect) => rect.type === "rectangle")
				.map(({ type, ...rect }) => rect),
		);
	const backAndForth = rectanglesOnly
		.map(bubbleCurrentRectangleToBytes)
		.map(bytesToBubbleCurrentRectangle);

	expect(backAndForth).toStrictEqual(rectanglesOnly);
});

test("parsePrg", () => {
	const levelFromPrg = parsePrg(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer,
	).levels[0]!;

	expect(levelFromPrg).toMatchSnapshot();
});

test("parsePrg chars", () => {
	expect(
		parsePrg(readFileSync(__dirname + "/decompressed-bb.prg").buffer).chars,
	).toMatchSnapshot();
});

test("First few levels bubble current rectangles.", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;

	const levelFromPrg = parsePrg(prg).levels;

	const rectsFromPrg = levelFromPrg
		.slice(0, knownGoodBubbleCurrentRectsForLevels.length)
		.map((level) => level.bubbleCurrentRectangles);

	expect(rectsFromPrg).toStrictEqual(knownGoodBubbleCurrentRectsForLevels);
});

// TODO: Replace with more fine-grained patch tests.
// test("patchPrg", () => {
// 	const prgFileContent = readFileSync(
// 		__dirname + "/decompressed-bb.prg",
// 	).buffer;

// 	const parsedPrg = parsePrg(prgFileContent);
// 	const patched = patchPrg(prgFileContent, parsedPrg, []);

// 	// Just comparing the ArrayBuffers is super slow and fails.
// 	expect(Buffer.from(patched)).toStrictEqual(Buffer.from(prgFileContent));
// });
