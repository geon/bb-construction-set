import { Char } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { strictChunk } from "../functions";
import { Level } from "../internal-data-formats/level";
import { mapTuple } from "../tuple";
import { ReadonlyUint8Array } from "../types";

export const linesPerChar = 8;

export function readPlatformChars(
	platformCharsBytes: ReadonlyUint8Array
): ReadonlyArray<Char> {
	return strictChunk([...platformCharsBytes], linesPerChar).map((char) =>
		mapTuple(char, parseColorPixelByte)
	);
}

export function writePlatformChars(
	platformChars: readonly Level["platformChar"][]
): Uint8Array {
	return new Uint8Array(
		platformChars.flatMap((platformChar) =>
			platformChar.map(
				(line) =>
					(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
			)
		)
	);
}
