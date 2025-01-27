import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
import { chunk } from "../functions";
import { GetBoundedByte, getBytes } from "./io";
import { GetByte } from "./types";

const linesPerChar = 8;

export function readPlatformChars(getPlatformCharsByte: GetBoundedByte) {
	return chunk(
		getBytes(getPlatformCharsByte, 100 * linesPerChar),
		linesPerChar
	).map((char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar));
}

export function readItemCharBlock(getByte: GetByte): CharBlock {
	return chunk(getBytes(getByte, 4 * linesPerChar), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) })
	) as CharBlock;
}
