import { zipObject } from "../functions";
import { Tuple } from "../tuple";
import {
	ColorPixelByte,
	isEqualColorPixelByte,
	serializeColorPixelByte,
} from "./color-pixel-byte";

export interface Char extends Tuple<ColorPixelByte, 8> {}

export function serializeChar(char: Char) {
	return char.map(serializeColorPixelByte);
}

export function isEqualChar(a: Char, b: Char): boolean {
	return zipObject({ a, b }).every(({ a, b }) => isEqualColorPixelByte(a, b));
}
