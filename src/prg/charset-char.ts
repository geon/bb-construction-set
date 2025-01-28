import { CharsetChar, parseCharsetCharLine, CharBlock } from "../charset-char";
import { chunk } from "../functions";
import { getBytes } from "./io";
import { GetByte } from "./types";

const linesPerChar = 8;

export function readPlatformChars(platformCharsBytes: DataView) {
	return chunk(getBytes(platformCharsBytes), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar)
	);
}

export function readItemCharBlock(getByte: GetByte): CharBlock {
	function getBytes(getByte: GetByte, length: number): readonly number[] {
		const bytes = Array<number>(length);
		for (let index = 0; index < length; ++index) {
			bytes[index] = getByte(index);
		}
		return bytes;
	}

	return chunk(getBytes(getByte, 4 * linesPerChar), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) })
	) as CharBlock;
}
