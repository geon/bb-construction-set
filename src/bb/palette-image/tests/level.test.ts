import { expect, test } from "vitest";
import {
	parseLevelTiles,
	drawLevelTiles,
	drawLevelsTiles,
	parseLevelsTiles,
} from "../level";
import { strictChunk } from "../../functions";
import { levelHeight, levelWidth } from "../../game-definitions/level-size";
import { assertTuple } from "../../tuple";
import { Tiles } from "../../internal-data-formats/level";
import { readFileSync } from "fs";
import { parsePrg } from "../../prg/parse-prg";

test("drawLevelTiles / parseLevelTiles", () => {
	const levelTiles: Tiles = assertTuple(
		strictChunk(
			`
				xxxxxxxxx____xxxxxx____xxxxxxxxx
				xx____________________________xx
				xx____________________________xx
				xx____x__________________x____xx
				xx____x_xxxxxxxxxxxxxxxxxx____xx
				xx____________________________xx
				xx____________________________xx
				xx____________________________xx
				xx____x__________________x____xx
				xx____xxxxxxxxxxxxxxxxxx_x____xx
				xx____________________________xx
				xx____________________________xx
				xx____________________________xx
				xx____x__________________x____xx
				xx____x_xxxxxxxxxxxxxxxxxx____xx
				xx____________________________xx
				xx____________________________xx
				xx____________________________xx
				xx____x__________________x____xx
				xx____xxxxxxxxx__xxxxxxxxx____xx
				xx____________________________xx
				xx____________________________xx
				xx____________________________xx
				xx____________________________xx
				xxxxxxxxx____xxxxxx____xxxxxxxxx
			`
				.split("")
				.map((char) => ({ x: true, _: false }[char]))
				.filter((char) => char !== undefined),
			levelWidth
		),
		levelHeight
	);

	expect(parseLevelTiles(drawLevelTiles(levelTiles))).toStrictEqual(levelTiles);
});

test("drawLevelsTiles / parseLevelsTiles", () => {
	const levelsTiles = assertTuple(
		parsePrg(
			readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
		).levels.map((level) => level.tiles),
		100
	);

	expect(parseLevelsTiles(drawLevelsTiles(levelsTiles))).toStrictEqual(
		levelsTiles
	);
});
