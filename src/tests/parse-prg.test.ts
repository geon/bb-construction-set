import { expect, test } from "vitest";
import { readFileSync } from "fs";
import {
	bubbleCurrentRectangleToBytes,
	parsePrg,
	patchPrg,
	bytesToBubbleCurrentRectangle,
} from "../parse-prg";
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
		new DataView(readFileSync(__dirname + "/decompressed-bb.prg").buffer)
	).levels[0];

	const levelFromPe = peFileDataToLevels(
		deserializePeFileData(readFileSync(__dirname + "/level-01.pe", "utf8"))
	)[0];

	// Not tested.
	levelFromPrg.bubbleCurrents = undefined!;
	levelFromPe.bubbleCurrents = undefined!;

	expect(levelFromPrg).toStrictEqual(levelFromPe);
});

test("First few levels bubble current rectangles.", () => {
	const prgDataView = new DataView(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer
	);

	const levelFromPrg = parsePrg(prgDataView).levels;

	const rectsFromPrg = levelFromPrg
		.slice(0, knownGoodBubbleCurrentRectsForLevels.length)
		.map((level) => level.bubbleCurrents);

	expect(rectsFromPrg).toStrictEqual(knownGoodBubbleCurrentRectsForLevels);
});

test("patchPrg", () => {
	const prgFileContent = readFileSync(__dirname + "/decompressed-bb.prg");

	const patched = Buffer.from(prgFileContent.buffer.slice());

	const { levels } = parsePrg(new DataView(prgFileContent.buffer));
	patchPrg(patched, levels);

	expect(patched).toStrictEqual(prgFileContent);
});
