import { Tuple } from "../tuple";
import { ColorPixelByte } from "./color-pixel-byte";

export interface Char extends Tuple<ColorPixelByte, 8> {}
export type CharBlock = Tuple<Char, 4>;
