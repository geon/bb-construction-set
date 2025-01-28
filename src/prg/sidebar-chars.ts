import { CharBlock, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { isBitSet } from "./bit-twiddling";
import { getBytes } from "./io";

export function readSidebarChars(
	sidebarCharsBytes: DataView,
	symmetryMetadataBytes: DataView
) {
	const linesPerChar = 8;
	const allSidebarCharBlocks = chunk(
		chunk(getBytes(sidebarCharsBytes), linesPerChar).map((char) => ({
			lines: char.map(parseCharsetCharLine),
		})),
		4
	) as CharBlock[];

	let sidebarCharsIndex = 0;
	const symmetryMetadata = getBytes(symmetryMetadataBytes);
	const sidebarChars = symmetryMetadata.map((byte) => {
		const hasSidebarChars = !isBitSet(byte, 1);
		return hasSidebarChars
			? allSidebarCharBlocks[sidebarCharsIndex++]
			: undefined;
	});

	return sidebarChars;
}
