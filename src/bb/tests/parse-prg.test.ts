import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { parsePrg, patchPrg } from "../parse-prg";
import {
	bubbleCurrentRectangleToBytes,
	bytesToBubbleCurrentRectangle,
} from "../prg/bubble-current-rectangles";
import { deserializePeFileData } from "../pe-file";
import { peFileDataToLevels } from "../level-pe-conversion";
import { knownGoodBubbleCurrentRectsForLevels } from "./knownGoodBubbleCurrentRectsForLevels";

test("readBubbleCurrentRectangles", () => {
	const rectanglesOnly = knownGoodBubbleCurrentRectsForLevels
		.filter((rects) => rects.type === "rectangles")
		.flatMap((foo) =>
			foo.rectangles
				.filter((rect) => rect.type === "rectangle")
				.map(({ type, ...rect }) => rect)
		);
	const backAndForth = rectanglesOnly
		.map(bubbleCurrentRectangleToBytes)
		.map(bytesToBubbleCurrentRectangle);

	expect(backAndForth).toStrictEqual(rectanglesOnly);
});

test("parsePrg", () => {
	const levelFromPrg = parsePrg(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer
	).levels[0];

	const levelFromPe = peFileDataToLevels(
		deserializePeFileData(readFileSync(__dirname + "/level-01.pe", "utf8"))
	)[0];

	// Not tested.
	levelFromPrg.bubbleCurrentRectangles = undefined!;
	levelFromPe.bubbleCurrentRectangles = undefined!;
	levelFromPrg.bubbleCurrentPerLineDefaults = undefined!;
	levelFromPe.bubbleCurrentPerLineDefaults = undefined!;

	expect(levelFromPrg).toStrictEqual(levelFromPe);
});

test("First few levels bubble current rectangles.", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;

	const levelFromPrg = parsePrg(prg).levels;

	const rectsFromPrg = levelFromPrg
		.slice(0, knownGoodBubbleCurrentRectsForLevels.length)
		.map((level) => level.bubbleCurrentRectangles);

	expect(rectsFromPrg).toStrictEqual(knownGoodBubbleCurrentRectsForLevels);
});

test("patchPrg", () => {
	const prgFileContent = readFileSync(__dirname + "/decompressed-bb.prg");

	const patched = prgFileContent.buffer.slice();

	const { levels } = parsePrg(prgFileContent.buffer);
	patchPrg(patched, levels, undefined);

	// Just comparing the ArrayBuffers is super slow and fails.
	expect(Buffer.from(patched)).toStrictEqual(Buffer.from(prgFileContent));
});
