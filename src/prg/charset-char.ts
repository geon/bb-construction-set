import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
import { chunk } from "../functions";
import { getBytes } from "./io";
import { GetByte } from "./types";

const linesPerChar = 8;

export function readCharsetChar(
	getByte: GetByte,
	address: number
): CharsetChar {
	return {
		lines: getBytes(getByte, address, linesPerChar).map((byte) =>
			parseCharsetCharLine(byte)
		),
	} as CharsetChar;
}

export function readCharBlock(
	getByte: GetByte,
	currentSidebarAddress: number
): CharBlock {
	return chunk(
		getBytes(getByte, currentSidebarAddress, 4 * linesPerChar),
		linesPerChar
	).map((char) => ({ lines: char.map(parseCharsetCharLine) })) as CharBlock;
}
