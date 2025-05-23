import { Tuple } from "../tuple";
import { ColorPixelByte } from "./color-pixel-byte";

export interface Char extends Tuple<ColorPixelByte, 8> {}
export type CharBlock = Tuple<Char, 4>;
export type CharBlockIndex = 0 | 1 | 2 | 3;
