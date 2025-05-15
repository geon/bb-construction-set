import { expect, test } from "vitest";
import {
	getAllItemCharMasks,
	getAllItemCharPalettes,
	getAllItemChars,
	layOutItemChars,
} from "../item";
import { readFileSync } from "fs";
import { parsePrg } from "../../prg/parse-prg";
import { leafs } from "../../../math/rect";

test("Sanity check: layOutItemChars, getAllItemChars, getAllItemCharMasks, getAllItemCharPalettes", () => {
	const charGroups = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	).items;

	const layout = layOutItemChars();
	const chars = getAllItemChars(charGroups);
	const masks = getAllItemCharMasks(charGroups);
	const palettes = getAllItemCharPalettes();

	expect(leafs(layout).length).toStrictEqual(chars.length);
	expect(masks.length).toStrictEqual(chars.length);
	expect(palettes.length).toStrictEqual(chars.length);
});
