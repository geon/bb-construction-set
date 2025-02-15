import { expect, test } from "vitest";
import { readSprites } from "../prg/sprites";
import { getDataSegments } from "../prg/io";
import { readFileSync } from "fs";
import { spriteDataSegmentLocations } from "../prg/data-locations";

test("readSprites snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const sprites = readSprites(segments);

	expect(sprites).toMatchSnapshot();
});
