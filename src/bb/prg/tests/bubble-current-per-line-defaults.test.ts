import { expect, test } from "vitest";
import { readBubbleCurrentPerLineDefaults } from "../bubble-current-per-line-defaults";
import { getDataSegments } from "../io";
import { readFileSync } from "fs";
import { readTileBitmaps } from "../tile-bitmap";
import { levelSegmentLocations } from "../data-locations";

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
		dataSegments.bubbleCurrentInHoles.buffer,
		tileBitmaps
	);

	expect(rectsFromPrg).toMatchSnapshot();
});
