import { CharBlock } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { isDefined, padRight, strictChunk } from "../functions";
import { Level } from "../internal-data-formats/level";
import { mapTuple } from "../tuple";
import { maxSidebars, levelSegmentLocations } from "./data-locations";
import { ReadonlyUint8Array } from "../types";

export function readSidebarChars(
	sidebarCharsBytes: ReadonlyUint8Array,
	sidebarCharsIndexBytes: ReadonlyUint8Array
) {
	const linesPerChar = 8;
	const allSidebarCharBlocks = strictChunk(
		strictChunk([...sidebarCharsBytes], linesPerChar).map((char) => ({
			lines: mapTuple(char, parseColorPixelByte),
		})),
		4
	);

	const mask = levelSegmentLocations.sidebarCharsIndex.mask;
	if (mask === undefined) {
		throw new Error("sidebarCharsIndex missing mask");
	}
	const sidebarChars = [...sidebarCharsIndexBytes].map((byte) => {
		const sidebarCharsIndex = byte & mask;
		const hasSidebarChars = sidebarCharsIndex < 100;
		return hasSidebarChars
			? allSidebarCharBlocks[sidebarCharsIndex]
			: undefined;
	});

	return sidebarChars;
}

export function writeSidebarChars(
	sidebarCharses: readonly Level["sidebarChars"][]
): Uint8Array {
	const sidebarLevels = sidebarCharses.filter(isDefined);
	if (sidebarLevels.length > maxSidebars) {
		throw new Error(
			`Too many levels with sidebar graphics: ${sidebarLevels.length}. Should be max ${maxSidebars}.`
		);
	}

	return new Uint8Array(
		padRight(
			sidebarLevels.flatMap((sidebarChars) =>
				sidebarChars.flatMap((char) =>
					char.lines.map(
						(line) =>
							(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
					)
				)
			),
			maxSidebars * 4 * 8,
			0
		)
	);
}

export function writeSidebarCharsIndex(
	sidebarCharses: readonly (CharBlock | undefined)[]
): Uint8Array {
	// TODO: Rewrite to find duplicates and reuse blocks.

	let index = 0;
	const sidebarCharsBits = sidebarCharses.map((sidebarChars) =>
		// Just use consecutive indices, just like the original levels.
		!sidebarChars ? 0b01111111 : index++
	);

	return new Uint8Array(sidebarCharsBits);
}
