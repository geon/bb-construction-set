import {
	CharsetChar,
	CharsetCharLine,
	parseCharsetCharLine,
	CharBlock,
} from "../charset-char";
import { GetByte } from "./types";

export function readCharsetChar(
	getByte: GetByte,
	address: number
): CharsetChar {
	const lines: CharsetCharLine[] = [];
	for (let i = 0; i < 8; ++i) {
		const line = parseCharsetCharLine(getByte(address + i));
		lines.push(line);
	}
	return { lines: lines as CharsetChar["lines"] };
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
