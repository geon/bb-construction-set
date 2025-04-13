import { expect, test } from "vitest";
import { parseSpriteGroupsFromPrg } from "../../prg/sprites";
import { convertSpriteGroupsToBinFile } from "../sprite-bin";
import { getDataSegments, getDataSegment } from "../../prg/io";
import { readFileSync } from "fs";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../../prg/data-locations";

test("readSpritesBin snapshot", () => {
	const prg = readFileSync(
		__dirname + "/../../prg/tests/decompressed-bb.prg"
	).buffer;
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
