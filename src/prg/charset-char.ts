import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
import { chunk } from "../functions";
import { getBytes } from "./io";
import { GetByte } from "./types";

export function readCharsetChar(
	getByte: GetByte,
	address: number
): CharsetChar {
	return {
		lines: getBytes(getByte, address, 8).map((byte) =>
			parseCharsetCharLine(byte)
		),
	} as CharsetChar;
}

export function readCharBlock(
	getByte: GetByte,
	currentSidebarAddress: number
): CharBlock {
	return chunk(getBytes(getByte, currentSidebarAddress, 4 * 8), 8).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) })
	) as CharBlock;
}
