import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { spriteDataSegmentLocations } from "../bb/prg/data-locations";
import { getDataSegments } from "../bb/prg/io";
import { characterNames, spriteColors, spriteCounts } from "../bb/sprite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sprites = new Uint8Array(
	getDataSegments(
		readFileSync(__dirname + "/../bb/tests/decompressed-bb.prg").buffer,
		spriteDataSegmentLocations
	).characters.buffer
).slice();

const colors = characterNames
	.map((name) => ({
		count: spriteCounts[name],
		color: spriteColors[name],
	}))
	.map((sprite) => Array<number>(sprite.count).fill(sprite.color))
	.flat();

for (const [index, color] of colors.entries()) {
	const multicolorBit = 0b10000000;
	sprites[(index + 1) * 64 - 1] = color | multicolorBit;
}

const fileName = __dirname + "/../../bubble bobble character sprites.bin";
writeFileSync(fileName, sprites);
