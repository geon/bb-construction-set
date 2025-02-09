import { expect, test } from "vitest";
import { readBubbleCurrentPerLineDefaults } from "../prg/bubble-current-per-line-defaults";
import { getDataSegments } from "../prg/io";
import { readFileSync } from "fs";
import { readTileBitmaps } from "../prg/tile-bitmap";

test("readBubbleCurrentPerLineDefaults snapshot", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer
	);

	const tileBitmaps = readTileBitmaps(
		dataSegments.bitmaps.buffer,
		dataSegments.symmetryMetadata.buffer
	);

	const rectsFromPrg = readBubbleCurrentPerLineDefaults(
		dataSegments.holeMetadata.buffer,
		tileBitmaps
	);

	expect(rectsFromPrg).toMatchSnapshot();
});
