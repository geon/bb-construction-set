import { expect, test } from "vitest";
import { readFileSync } from "fs";
import {
	parsePrg,
	parsePrgSpriteBin,
	patchPrg,
	patchPrgSpritesBin,
} from "../parse-prg";
import {
	bubbleCurrentRectangleToBytes,
	bytesToBubbleCurrentRectangle,
} from "../bubble-current-rectangles";
import { knownGoodBubbleCurrentRectsForLevels } from "./knownGoodBubbleCurrentRectsForLevels";
import { parseSpriteGroupsFromBin } from "../sprites";

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
	).levels[0]!;

	expect(levelFromPrg).toMatchSnapshot();
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
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg"
	).buffer;

	const { levels } = parsePrg(prgFileContent);
	const patched = patchPrg(prgFileContent, levels, undefined, "originalC64");

	// Just comparing the ArrayBuffers is super slow and fails.
	expect(Buffer.from(patched)).toStrictEqual(Buffer.from(prgFileContent));
});

test("patchPrgSpritesBin", () => {
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg"
	).buffer;

	const spritesBin = parseSpriteGroupsFromBin(
		parsePrgSpriteBin(prgFileContent)
	);

	const patched = patchPrgSpritesBin(prgFileContent, spritesBin);

	// Just comparing the ArrayBuffers is super slow and fails.
	expect(Buffer.from(patched)).toStrictEqual(Buffer.from(prgFileContent));
});
