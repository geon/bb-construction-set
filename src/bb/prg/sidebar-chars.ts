import { Char, serializeChar } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { isDefined, padRight, strictChunk, uniqueBy } from "../functions";
import { assertTuple, mapTuple, Tuple } from "../tuple";
import { maxSidebars, levelSegmentLocations } from "./data-locations";
import { ReadonlyUint8Array } from "../types";
import {
	CharBlock,
	charBlockFromTuple,
	isEqualCharBlock,
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
	const deduplicatedBlocks = uniqueBy(
		sidebarCharBlocks.filter(isDefined),
		(block) => JSON.stringify(block),
	);

	if (deduplicatedBlocks.length > maxSidebars) {
		throw new Error(
			`Too many levels with unique sidebar graphics: ${deduplicatedBlocks.length}. Should be max ${maxSidebars}.`,
		);
	}

	const sidebarChars = new Uint8Array(
		padRight(
			deduplicatedBlocks
				.map(tupleFromBlockFrom2x2CharBlock)
				.flatMap((sidebarChars) => sidebarChars.flatMap(serializeChar)),
			maxSidebars * 4 * 8,
			0,
		),
	);

	const foundIndices = sidebarCharBlocks.map(
		(block) =>
			block && deduplicatedBlocks.findIndex((x) => isEqualCharBlock(x, block)),
	);

	const sidebarCharsIndex = new Uint8Array(
		foundIndices.map((index) => index ?? 0b01111111),
	);

	return {
		sidebarChars,
		sidebarCharsIndex,
	};
}
