import { Tuple } from "../tuple";
import { ColorPixelByte, serializeColorPixelByte } from "./color-pixel-byte";

export interface Char extends Tuple<ColorPixelByte, 8> {}

export function serializeChar(char: Char) {
	return char.map(serializeColorPixelByte);
}
