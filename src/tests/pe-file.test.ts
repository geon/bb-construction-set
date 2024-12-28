import { expect, test } from "vitest";
import { readFileSync } from "fs";
import {
	deserializePeFileData,
	PeFileData,
	serializePeFileData,
} from "../pe-file";

test("deserializePeFileData", () => {
	const peFileDataFromPeFile = deserializePeFileData(
		readFileSync(__dirname + "/c64-start-screen.pe", "utf8")
	);
	const peFileDataFromJson = JSON.parse(
		readFileSync(__dirname + "/c64-start-screen.json", "utf8")
	);

	expect(peFileDataFromPeFile).toStrictEqual(peFileDataFromJson);
});

test("serializePeFileData", () => {
	expect(
		serializePeFileData({ foo: 123 } as unknown as PeFileData)
	).toStrictEqual('{"app":"PETSCII Editor","data":"{\\"foo\\":123}"}');
});

test("deserializePeFileData unmangled", () => {
	const peFileDataFromUnmangledPeFile = deserializePeFileData(
		readFileSync(__dirname + "/c64-start-screen.unmangled.pe", "utf8")
	);

	const peFileDataFromPeFile = deserializePeFileData(
		readFileSync(__dirname + "/c64-start-screen.pe", "utf8")
	);

	expect(peFileDataFromUnmangledPeFile).toStrictEqual(peFileDataFromPeFile);
});
