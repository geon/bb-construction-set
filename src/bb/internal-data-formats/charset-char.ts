import { ReadonlyTuple } from "../tuple";
import { ColorPixelByte } from "./color-pixel-byte";

export interface CharsetChar {
	readonly lines: ReadonlyTuple<ColorPixelByte, 8>;
}
export type CharBlock = ReadonlyTuple<CharsetChar, 4>;
export type CharBlockIndex = 0 | 1 | 2 | 3;
