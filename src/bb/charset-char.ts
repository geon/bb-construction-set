import { ReadonlyTuple } from "./tuple";

export type CharsetCharColor = 0 | 1 | 2 | 3;
export type CharsetCharLine = ReadonlyTuple<CharsetCharColor, 4>;
export interface CharsetChar {
	readonly lines: ReadonlyTuple<CharsetCharLine, 8>;
}
export type CharBlock = ReadonlyTuple<CharsetChar, 4>;
export type CharBlockIndex = 0 | 1 | 2 | 3;

export function parseCharsetCharLine(byte: number): CharsetCharLine {
	return [
		((byte >> 6) & 0b11) as CharsetCharColor,
		((byte >> 4) & 0b11) as CharsetCharColor,
		((byte >> 2) & 0b11) as CharsetCharColor,
		((byte >> 0) & 0b11) as CharsetCharColor,
	];
}

export type RowCharBlock = ReadonlyTuple<ReadonlyTuple<CharsetChar, 2>, 2>;
