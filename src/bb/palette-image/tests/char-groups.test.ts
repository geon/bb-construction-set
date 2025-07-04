import { expect, test } from "vitest";
import {
	drawCharGroups,
	getAllCharMasks,
	getAllCharPalettes,
	getAllChars,
	layOutChars,
	parseCharGroups,
} from "../char-groups";
import { readFileSync } from "fs";
import { parsePrg } from "../../prg/parse-prg";
import { leafs } from "../../../math/rect";

test("Sanity check: layOutChars, getAllChars, getAllCharMasks, getAllCharPalettes", () => {
	const charGroups = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	).chars;

	const layout = layOutChars();
	const chars = getAllChars(charGroups);
	const masks = getAllCharMasks(charGroups);
	const palettes = getAllCharPalettes();

	expect(leafs(layout).length).toStrictEqual(chars.length);
	expect(masks.length).toStrictEqual(chars.length);
	expect(palettes.length).toStrictEqual(chars.length);
});

test("drawCharGroups / parseCharGroups", () => {
	const charGroups = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	).chars;

	expect(parseCharGroups(drawCharGroups(charGroups))).toStrictEqual(charGroups);
});
