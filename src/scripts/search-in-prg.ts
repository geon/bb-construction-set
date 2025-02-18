import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { spriteColors } from "../bb/sprite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prg = new Uint8Array(
	readFileSync(__dirname + "/../bb/tests/decompressed-bb.prg").buffer
);

const needle = Object.values(spriteColors).slice(1);

const found = prg.findIndex((_, prgIndex) =>
	needle.every(
		(_, needleIndex) => prg[prgIndex + needleIndex] === needle[needleIndex]
	)
);

console.log("found:", "0x" + found.toString(16));
