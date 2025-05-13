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
// One of the animated fire chars.
// const needle: number[] = [4, 25, 25, 100, 100, 105, 105, 20];
// Explosion hexagon sprite.
// const needle: number[] = [
// 	0, 40, 0, 0, 170, 0, 2, 170, 128, 2, 170, 128, 10, 170, 160, 10, 170, 160, 10,
// 	170, 160, 10, 170, 160, 2, 170, 128, 2, 170, 128, 0, 170, 0, 0, 40, 0,
// ];
// Secret level top left side bar.
// const needle: number[] = [170, 149, 145, 149, 149, 149, 148, 145];
// Secret level urn.
// const needle: number[] = [0, 5, 63, 15, 14, 14, 15, 63];
// Sectret level pedestal right edge.
// const needle: number[] = [64, 64, 64, 64, 64, 64, 64, 64];

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
