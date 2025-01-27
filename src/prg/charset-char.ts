import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
import { chunk } from "../functions";
import { GetBoundedByte, getBytes } from "./io";
import { GetByte } from "./types";

const linesPerChar = 8;

export function readPlatformChars(getPlatformCharsByte: GetBoundedByte) {
	return chunk(
		getBytes(getPlatformCharsByte, 0, 100 * linesPerChar),
		linesPerChar
	).map((char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar));
}

export function readItemCharBlock(
	getByte: GetByte,
	currentSidebarAddress: number
): CharBlock {
	return chunk(
		getBytes(getByte, currentSidebarAddress, 4 * linesPerChar),
		linesPerChar
	).map((char) => ({ lines: char.map(parseCharsetCharLine) })) as CharBlock;
}
