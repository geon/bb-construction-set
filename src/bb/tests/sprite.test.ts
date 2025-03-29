import { expect, test } from "vitest";
import { readSpriteGroups, readSprites, readSpritesBin } from "../prg/sprites";
import { getDataSegments, getDataSegment } from "../prg/io";
import { readFileSync } from "fs";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../prg/data-locations";
import { spriteColors } from "../sprite";

test("readSprites snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const colorSegment = getDataSegment(prg, monsterSpriteColorsSegmentLocation);
	const sprites = readSprites(segments, colorSegment, spriteColors.player);

	expect(sprites).toMatchSnapshot();
});

test("readSpritesBin snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const monsterColorsSegment = getDataSegment(
		prg,
		monsterSpriteColorsSegmentLocation
	);

	const sprites = readSpritesBin(
		readSpriteGroups(segments, monsterColorsSegment, spriteColors.player)
	);

	expect(sprites).toMatchSnapshot();
});
