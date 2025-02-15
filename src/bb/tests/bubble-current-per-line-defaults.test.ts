import { expect, test } from "vitest";
import { readBubbleCurrentPerLineDefaults } from "../prg/bubble-current-per-line-defaults";
import { getDataSegments } from "../prg/io";
import { readFileSync } from "fs";
import { readTileBitmaps } from "../prg/tile-bitmap";
import { levelSegmentLocations } from "../prg/data-locations";

test("readBubbleCurrentPerLineDefaults snapshot", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer,
		levelSegmentLocations
	);

	const tileBitmaps = readTileBitmaps(
		dataSegments.bitmaps.buffer,
		dataSegments.symmetry.buffer
	);

	const rectsFromPrg = readBubbleCurrentPerLineDefaults(
		dataSegments.holeMetadata.buffer,
		tileBitmaps
	);

	expect(rectsFromPrg).toMatchSnapshot();
});
