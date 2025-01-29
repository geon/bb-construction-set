import { expect, test } from "vitest";
import { readBubbleCurrentRectangles } from "../prg/bubble-current-rectangles";
import { getDataSegments } from "../prg/io";
import { readFileSync } from "fs";

test("readBubbleCurrentRectangles snapshot", () => {
	const dataSegments = getDataSegments(
		readFileSync(__dirname + "/decompressed-bb.prg").buffer
	);

	const rectsFromPrg = readBubbleCurrentRectangles(dataSegments.windCurrents);

	expect(rectsFromPrg).toMatchSnapshot();
});
