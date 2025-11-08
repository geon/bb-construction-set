import { Tuple } from "../tuple";
import { ColorPixelByte } from "./color-pixel-byte";

export interface Char extends Tuple<ColorPixelByte, 8> {}
export type Char4Tuple = Tuple<Char, 4>;
