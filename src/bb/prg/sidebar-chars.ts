import { Char, serializeChar } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { isDefined, padRight, strictChunk } from "../functions";
import { assertTuple, mapTuple, Tuple } from "../tuple";
import { maxSidebars, levelSegmentLocations } from "./data-locations";
import { ReadonlyUint8Array } from "../types";
import {
	CharBlock,
	charBlockFromTuple,
	tupleFromBlockFrom2x2CharBlock,
} from "../internal-data-formats/char-block";

export function readSidebarChars(
	sidebarCharsBytes: ReadonlyUint8Array,
	sidebarCharsIndexBytes: ReadonlyUint8Array,
): Tuple<CharBlock | undefined, 100> {
	const linesPerChar = 8;
	const allSidebarCharBlocks = strictChunk(
		strictChunk([...sidebarCharsBytes], linesPerChar).map(
			(char): Char => mapTuple(char, parseColorPixelByte),
		),
		4,
	).map(charBlockFromTuple);

	const mask = levelSegmentLocations.sidebarCharsIndex.mask;
	if (mask === undefined) {
		throw new Error("sidebarCharsIndex missing mask");
	}
	const sidebarChars = assertTuple(
		[...sidebarCharsIndexBytes].map((byte) => {
			const sidebarCharsIndex = byte & mask;
			const hasSidebarChars = sidebarCharsIndex < 100;
			return hasSidebarChars
				? allSidebarCharBlocks[sidebarCharsIndex]
				: undefined;
		}),
		100,
	);

	return sidebarChars;
}

export function writeSidebarCharsAndIndices(
	sidebarCharBlocks: Tuple<CharBlock | undefined, 100>,
): {
	readonly sidebarChars: Uint8Array;
	readonly sidebarCharsIndex: Uint8Array;
} {
	const sidebarLevels = sidebarCharBlocks.filter(isDefined);
	if (sidebarLevels.length > maxSidebars) {
		throw new Error(
			`Too many levels with sidebar graphics: ${sidebarLevels.length}. Should be max ${maxSidebars}.`,
		);
	}

	const sidebarChars = new Uint8Array(
		padRight(
			sidebarLevels
				.map(tupleFromBlockFrom2x2CharBlock)
				.flatMap((sidebarChars) => sidebarChars.flatMap(serializeChar)),
			maxSidebars * 4 * 8,
			0,
		),
	);

	// TODO: Rewrite to find duplicates and reuse blocks.

	let index = 0;
	const sidebarCharsBits = sidebarCharBlocks.map((sidebarChars) =>
		// Just use consecutive indices, just like the original levels.
		!sidebarChars ? 0b01111111 : index++,
	);

	const sidebarCharsIndex = new Uint8Array(sidebarCharsBits);

	return {
		sidebarChars,
		sidebarCharsIndex,
	};
}
