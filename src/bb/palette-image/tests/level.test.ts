import { expect, test } from "vitest";
import {
	parseLevelTiles,
	drawLevelTiles,
	drawLevelsTiles,
	parseLevelsTiles,
} from "../level";
import { strictChunk } from "../../functions";
import { assertTuple } from "../../tuple";
import { getTiles, Tiles } from "../../internal-data-formats/tiles";
import { readFileSync } from "fs";
import { parsePrg } from "../../prg/parse-prg";
import { levelSize } from "../../game-definitions/level-size";

test("drawLevelTiles / parseLevelTiles", () => {
	const tiles: Tiles = assertTuple(
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
			levelSize.x
		),
		levelSize.y
	);

	expect(parseLevelTiles(drawLevelTiles(tiles))).toStrictEqual(tiles);
});

test("drawLevelsTiles / parseLevelsTiles", () => {
	const levelsTiles = assertTuple(
		parsePrg(
			readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
		).levels.map(getTiles),
		100
	);

	expect(parseLevelsTiles(drawLevelsTiles(levelsTiles))).toStrictEqual(
		levelsTiles
	);
});
