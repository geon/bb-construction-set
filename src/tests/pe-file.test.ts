import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { deserializePeFileData } from "../pe-file";

test("deserializePeFileData", () => {
	const peFileDataFromPeFile = deserializePeFileData(
		readFileSync(__dirname + "/c64-start-screen.pe", "utf8")
	);
	const peFileDataFromJson = JSON.parse(
		readFileSync(__dirname + "/c64-start-screen.json", "utf8")
	);

	expect(peFileDataFromPeFile).toStrictEqual(peFileDataFromJson);
});
