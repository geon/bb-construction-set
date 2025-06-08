import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../bb/prg/data-locations";
import { getDataSegment, getDataSegments } from "../bb/prg/io";
import { parseSpriteGroupsFromPrg } from "../bb/prg/sprites";
import { serializeSpriteGroups } from "../bb/sprite-bin/sprite-bin";
// import { spriteColors } from "../bb/sprite";
// import { readSpritesBin } from "../bb/prg/sprites";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prg = readFileSync(__dirname + "/../bb/tests/decompressed-bb.prg").buffer;

const spritesBin = serializeSpriteGroups(
	parseSpriteGroupsFromPrg(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation)
	)
);

const fileName = __dirname + "/../../bubble bobble sprites.bin";
writeFileSync(fileName, spritesBin);
