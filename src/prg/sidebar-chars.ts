import { CharBlock, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { isBitSet } from "./bit-twiddling";
import { maxSidebars } from "./data-locations";
import { GetBoundedByte, getBytes } from "./io";

export function readSidebarChars(
	getSidebarCharsByte: GetBoundedByte,
	getSymmetryMetadataByte: GetBoundedByte
) {
	const linesPerChar = 8;
	const bytesPerCharBlock = 4 * linesPerChar; // 4 chars of 8 bytes each.
	const allSidebarCharBlocks = chunk(
		chunk(
			getBytes(getSidebarCharsByte, bytesPerCharBlock * maxSidebars),
			linesPerChar
		).map((char) => ({ lines: char.map(parseCharsetCharLine) })),
		4
	) as CharBlock[];

	let sidebarCharsIndex = 0;
	const symmetryMetadata = getBytes(getSymmetryMetadataByte, 100);
	const sidebarChars = symmetryMetadata.map((byte) => {
		const hasSidebarChars = !isBitSet(byte, 1);
		return hasSidebarChars
			? // TODO: Check for index out of bounds: maxSidebars
			  allSidebarCharBlocks[sidebarCharsIndex++]
			: undefined;
	});

	return sidebarChars;
}
