import {
	CharsetChar,
	parseCharsetCharLine,
} from "../internal-data-formats/charset-char";
import { strictChunk } from "../functions";
import { Level } from "../internal-data-formats/level";
import { mapTuple } from "../tuple";
import { ReadonlyUint8Array } from "../types";

export const linesPerChar = 8;

export function readPlatformChars(
	platformCharsBytes: ReadonlyUint8Array
): ReadonlyArray<CharsetChar> {
	return strictChunk([...platformCharsBytes], linesPerChar).map((char) => ({
		lines: mapTuple(char, parseCharsetCharLine),
	}));
}

export function writePlatformChars(
	platformChars: readonly Level["platformChar"][]
): Uint8Array {
	return new Uint8Array(
		platformChars.flatMap((platformChar) =>
			platformChar.lines.map(
				(line) =>
					(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
			)
		)
	);
}
