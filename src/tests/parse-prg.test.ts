import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { parsePrg, patchPrg } from "../parse-prg";
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
	levelFromPrg.bubbleCurrents.perLineDefaults = [];
	levelFromPe.bubbleCurrents.perLineDefaults = [];

	expect(levelFromPrg).toStrictEqual(levelFromPe);
});

test("patchPrg", () => {
	const prgFileContent = readFileSync(__dirname + "/decompressed-bb.prg");

	const patched = Buffer.from(prgFileContent.buffer.slice());

	const { levels } = parsePrg(new DataView(prgFileContent.buffer));
	patchPrg(patched, levels);

	expect(patched).toStrictEqual(prgFileContent);
});
