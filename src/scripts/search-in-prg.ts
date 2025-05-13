import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prg = new Uint8Array(
	readFileSync(__dirname + "/../bb/prg/tests/decompressed-bb.prg").buffer
);

const needle: number[] = [];

const found = prg.findIndex((_, prgIndex) =>
	needle.every(
		(_, needleIndex) => prg[prgIndex + needleIndex] === needle[needleIndex]
	)
);

console.log("found:", "0x" + found.toString(16));
