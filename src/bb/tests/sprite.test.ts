import { expect, test } from "vitest";
import {
	parseSpriteGroupsFromPrg,
	convertSpriteGroupsToBinFile,
} from "../prg/sprites";
import { getDataSegments, getDataSegment } from "../prg/io";
import { readFileSync } from "fs";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../prg/data-locations";
import { spriteColors } from "../sprite";

test("readSpritesBin snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const segments = getDataSegments(prg, spriteDataSegmentLocations);
	const monsterColorsSegment = getDataSegment(
		prg,
		monsterSpriteColorsSegmentLocation
	);

	const sprites = convertSpriteGroupsToBinFile(
		parseSpriteGroupsFromPrg(
			segments,
			monsterColorsSegment,
			spriteColors.player
		)
	);

	expect(sprites).toMatchSnapshot();
});
