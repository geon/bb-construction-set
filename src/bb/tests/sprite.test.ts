import { expect, test } from "vitest";
import { readSprites, readSpritesBin } from "../prg/sprites";
import { getDataSegments, getDataSegment } from "../prg/io";
import { readFileSync } from "fs";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../prg/data-locations";

test("readSprites snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const sprites = readSprites(segments);

	expect(sprites).toMatchSnapshot();
});

test("readSpritesBin snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const monsterColorsSegment = getDataSegment(
		prg,
		monsterSpriteColorsSegmentLocation
	);

	const sprites = readSpritesBin(segments, monsterColorsSegment);

	expect(sprites).toMatchSnapshot();
});
