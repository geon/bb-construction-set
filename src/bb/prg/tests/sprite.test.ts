import { expect, test } from "vitest";
import {
	parseSpriteGroupsFromPrg,
	convertSpriteGroupsToBinFile,
} from "../sprites";
import { getDataSegments, getDataSegment } from "../io";
import { readFileSync } from "fs";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../data-locations";

test("readSpritesBin snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const monsterColorsSegment = getDataSegment(
		prg,
		monsterSpriteColorsSegmentLocation
	);

	const sprites = convertSpriteGroupsToBinFile(
		parseSpriteGroupsFromPrg(segments, monsterColorsSegment)
	);

	expect(sprites).toMatchSnapshot();
});
