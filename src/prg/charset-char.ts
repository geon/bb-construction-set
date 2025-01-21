import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
import { chunk } from "../functions";
import { platformCharArrayAddress } from "./data-locations";
import { getBytes } from "./io";
import { GetByte } from "./types";

const linesPerChar = 8;

export function readPlatformChars(getByte: GetByte) {
	return chunk(
		getBytes(getByte, platformCharArrayAddress, 100 * linesPerChar),
		linesPerChar
	).map((char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar));
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
