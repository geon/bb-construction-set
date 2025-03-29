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
} from "../prg/bubble-current-rectangles";
import { deserializePeFileData } from "../pe-file";
import { peFileDataToLevels } from "../level-pe-conversion";
import { knownGoodBubbleCurrentRectsForLevels } from "./knownGoodBubbleCurrentRectsForLevels";
import {
	readSpriteGroups,
	readSpritesBin,
	writeSpritesBin,
} from "../prg/sprites";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../prg/data-locations";
import { getDataSegments, getDataSegment } from "../prg/io";
import { spriteColors } from "../sprite";

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

	const levelFromPe = peFileDataToLevels(
		deserializePeFileData(readFileSync(__dirname + "/level-01.pe", "utf8"))
	)[0]!;

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
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg"
	).buffer;

	const { levels } = parsePrg(prgFileContent);
	const patched = patchPrg(prgFileContent, levels, undefined, "originalC64");

	// Just comparing the ArrayBuffers is super slow and fails.
	expect(Buffer.from(patched)).toStrictEqual(Buffer.from(prgFileContent));
});

test("spritesBin color", () => {
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg"
	).buffer;

	const prgSpriteSegments = getDataSegments(
		prgFileContent,
		spriteDataSegmentLocations
	);
	const prgSpriteColorSegment = getDataSegment(
		prgFileContent,
		monsterSpriteColorsSegmentLocation
	);
	const spritesBin = writeSpritesBin(
		readSpritesBin(
			readSpriteGroups(
				prgSpriteSegments,
				prgSpriteColorSegment,
				spriteColors.player
			)
		)
	);

	// Just comparing the ArrayBuffers is super slow and fails.
	expect(Buffer.from(spritesBin.spriteColorsSegment)).toStrictEqual(
		Buffer.from(prgSpriteColorSegment.buffer)
	);
});

test("patchPrgSpritesBin", () => {
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg"
	).buffer;

	const spritesBin = writeSpritesBin(parsePrgSpriteBin(prgFileContent));

	const patched = patchPrgSpritesBin(
		prgFileContent,
		spritesBin.spriteSegments,
		spritesBin.spriteColorsSegment
	);

	// Just comparing the ArrayBuffers is super slow and fails.
	expect(Buffer.from(patched)).toStrictEqual(Buffer.from(prgFileContent));
});
