import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
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
	return [
		readCharsetChar(getByte, currentSidebarAddress + 0 * 8),
		readCharsetChar(getByte, currentSidebarAddress + 1 * 8),
		readCharsetChar(getByte, currentSidebarAddress + 2 * 8),
		readCharsetChar(getByte, currentSidebarAddress + 3 * 8),
	];
}
