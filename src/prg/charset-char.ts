import { CharsetChar, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { Level } from "../level";
import { platformCharArrayAddress } from "./data-locations";
import { getBytes } from "./io";
import { SetBytes } from "./types";

export const linesPerChar = 8;

export function readPlatformChars(platformCharsBytes: DataView) {
	return chunk(getBytes(platformCharsBytes), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) } as CharsetChar)
	);
}

export function patchPlatformChars(
	setBytes: SetBytes,
	levels: readonly Level[]
) {
	setBytes(
		platformCharArrayAddress,
		levels.flatMap((level) =>
			level.platformChar.lines.map(
				(line) =>
					(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
			)
		)
	);
}
