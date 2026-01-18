import { readFileSync } from "fs";
import { expect, test } from "vitest";
import { parsePrg } from "../parse-prg";
import {
	parseItemSpawnPositions,
	serializeItemSpawnPositions,
} from "../item-spawn-positions";
import { assertTuple } from "../../tuple";

test("parseItemSpawnPositions / serializeItemSpawnPositions", () => {
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg",
	).buffer;
	const parsedPrg = parsePrg(prgFileContent);

	const backAndForth = parseItemSpawnPositions(
		serializeItemSpawnPositions(
			assertTuple(
				parsedPrg.levels.map((level) => level.itemSpawnPositions),
				100,
			),
		),
	);

	expect(backAndForth).toStrictEqual(
		parsedPrg.levels.map((level) => level.itemSpawnPositions),
	);
});
