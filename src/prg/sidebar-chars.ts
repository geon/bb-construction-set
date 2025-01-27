import { CharBlock, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { isBitSet } from "./bit-twiddling";
import { maxSidebars, symmetryMetadataArrayAddress } from "./data-locations";
import { GetBoundedByte, getBytes } from "./io";
import { GetByte } from "./types";

export function readSidebarChars(
	getSidebarCharsByte: GetBoundedByte,
	getByte: GetByte
) {
	const linesPerChar = 8;
	const bytesPerCharBlock = 4 * linesPerChar; // 4 chars of 8 bytes each.
	const allSidebarCharBlocks = chunk(
		chunk(
			getBytes(getSidebarCharsByte, 0, bytesPerCharBlock * maxSidebars),
			linesPerChar
		).map((char) => ({ lines: char.map(parseCharsetCharLine) })),
		4
	) as CharBlock[];

	let sidebarCharsIndex = 0;
	const symmetryMetadata = getBytes(getByte, symmetryMetadataArrayAddress, 100);
	const sidebarChars = symmetryMetadata.map((byte) => {
		const hasSidebarChars = !isBitSet(byte, 1);
		return hasSidebarChars
			? // TODO: Check for index out of bounds: maxSidebars
			  allSidebarCharBlocks[sidebarCharsIndex++]
			: undefined;
	});

	return sidebarChars;
}
