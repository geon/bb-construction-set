import { CharsetChar, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { Level } from "../level";
import { dataViewSetBytes, getBytes } from "./io";
import { ReadonlyUint8Array } from "./types";

export const linesPerChar = 8;

export function readPlatformChars(platformCharsBytes: ReadonlyUint8Array) {
	return chunk(getBytes(platformCharsBytes), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar)
	);
}

export function patchPlatformChars(
	dataView: Uint8Array,
	platformChars: readonly Level["platformChar"][]
) {
	dataViewSetBytes(
		dataView,
		platformChars.flatMap((platformChar) =>
			platformChar.lines.map(
				(line) =>
					(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
			)
		)
	);
}
