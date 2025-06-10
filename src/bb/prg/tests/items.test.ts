import { readFileSync } from "fs";
import { expect, test } from "vitest";
import { parsePrg } from "../parse-prg";
import { parseItems, serializeItems } from "../items";

test("parseItems / serializeItems", () => {
	const prgFileContent = readFileSync(
		__dirname + "/decompressed-bb.prg"
	).buffer;
	const parsedPrg = parsePrg(prgFileContent);

	const backAndForth = parseItems(serializeItems(parsedPrg.items));

	expect(backAndForth).toStrictEqual(parsedPrg.items);
});
