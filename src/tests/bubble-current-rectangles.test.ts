import { expect, test } from "vitest";
import { readBubbleCurrentRectangles } from "../prg/bubble-current-rectangles";
import { getDataSegments } from "../prg/io";
import { readFileSync } from "fs";
import { readTileBitmaps } from "../prg/tile-bitmap";

test("readBubbleCurrentRectangles snapshot", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer
	);

	const tileBitmaps = readTileBitmaps(
		dataSegments.bitmaps,
		dataSegments.symmetryMetadata
	);
	const rectsFromPrg = readBubbleCurrentRectangles(
		dataSegments.windCurrents,
		dataSegments.holeMetadata,
		tileBitmaps
	);

	expect(rectsFromPrg).toMatchSnapshot();
});
