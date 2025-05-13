import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { getPrgStartAddress } from "../bb/prg/io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prg = new Uint8Array(
	readFileSync(__dirname + "/../bb/prg/tests/decompressed-bb.prg").buffer
);

// Water char.
// const needle: number[] = [127, 233, 255, 247, 191, 63, 222, 253];

const needle: number[] = [];

const found = prg.findIndex((_, prgIndex) =>
	needle.every(
		(_, needleIndex) => prg[prgIndex + needleIndex] === needle[needleIndex]
	)
);

if (found === -1) {
	console.log("not found");
} else {
	const startAddress = getPrgStartAddress(prg.buffer);
	const address = startAddress + found - 2;
	console.log("found:", "0x" + address.toString(16));
}
