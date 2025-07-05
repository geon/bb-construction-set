import { expect, test } from "vitest";
import { parseSpriteGroupsFromPrg } from "../../prg/sprites";
import { serializeSpriteGroups } from "../sprite-bin";
import { getDataSegments, getDataSegment } from "../../prg/io";
import { readFileSync } from "fs";
import {
	largeBonusSpriteColorsSegmentLocation,
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
	const largeBonusSpriteColorsSegment = getDataSegment(
		prg,
		largeBonusSpriteColorsSegmentLocation
	);

	const sprites = serializeSpriteGroups(
		parseSpriteGroupsFromPrg(
			segments,
			monsterColorsSegment,
			largeBonusSpriteColorsSegment
		)
	);

	expect(sprites).toMatchSnapshot();
});
