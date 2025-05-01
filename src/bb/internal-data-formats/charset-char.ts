import { ReadonlyTuple } from "../tuple";
import { SubPaletteIndex } from "./palette";

export type ColorPixelByte = ReadonlyTuple<SubPaletteIndex, 4>;
export interface CharsetChar {
	readonly lines: ReadonlyTuple<ColorPixelByte, 8>;
}
export type CharBlock = ReadonlyTuple<CharsetChar, 4>;
export type CharBlockIndex = 0 | 1 | 2 | 3;

export function parseColorPixelByte(byte: number): ColorPixelByte {
	return [
		((byte >> 6) & 0b11) as SubPaletteIndex,
		((byte >> 4) & 0b11) as SubPaletteIndex,
		((byte >> 2) & 0b11) as SubPaletteIndex,
		((byte >> 0) & 0b11) as SubPaletteIndex,
	];
}
