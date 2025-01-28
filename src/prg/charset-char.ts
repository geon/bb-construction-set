import { CharsetChar, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { getBytes } from "./io";

export const linesPerChar = 8;

export function readPlatformChars(platformCharsBytes: DataView) {
	return chunk(getBytes(platformCharsBytes), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar)
	);
}
