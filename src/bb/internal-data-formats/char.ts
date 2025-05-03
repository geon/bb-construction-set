import { ReadonlyTuple } from "../tuple";
import { ColorPixelByte } from "./color-pixel-byte";

export interface Char extends ReadonlyTuple<ColorPixelByte, 8> {}
export type CharBlock = ReadonlyTuple<Char, 4>;
export type CharBlockIndex = 0 | 1 | 2 | 3;
