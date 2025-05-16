import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { getPrgStartAddress } from "../bb/prg/io";
import { range } from "../bb/functions";

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

const founds = range(0, prg.byteLength).filter((prgIndex) =>
	needle.every(
		(_, needleIndex) => prg[prgIndex + needleIndex] === needle[needleIndex]
	)
);

function indexToAddress(index: number) {
	const startAddress = getPrgStartAddress(prg.buffer);
	const address = startAddress + index - 2;
	return address;
}

function formatHex(address: number) {
	const formatted = "0x" + address.toString(16);
	return formatted;
}

if (!founds.length) {
	console.log("not found");
} else {
	for (const found of founds) {
		console.log("found:", formatHex(indexToAddress(found)));
	}
}
