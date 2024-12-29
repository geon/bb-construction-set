import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { parsePrg } from "../parse-prg";
import { deserializePeFileData } from "../pe-file";
import { peFileDataToLevels } from "../level-pe-conversion";

test("parsePrg", () => {
	const levelFromPrg = parsePrg(
		new DataView(readFileSync(__dirname + "/decompressed-bb.prg").buffer)
	).levels[0];

	const levelFromPe = peFileDataToLevels(
		deserializePeFileData(readFileSync(__dirname + "/level-01.pe", "utf8"))
	)[0];

	// Not tested.
	levelFromPrg.bubbleCurrentLineDefault = [];
	levelFromPe.bubbleCurrentLineDefault = [];

	expect(levelFromPrg).toStrictEqual(levelFromPe);
});
