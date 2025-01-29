import { CharBlock, parseCharsetCharLine } from "../charset-char";
import { chunk, isDefined } from "../functions";
import { Level } from "../level";
import { isBitSet } from "./bit-twiddling";
import { maxSidebars } from "./data-locations";
import { dataViewSetBytes, getBytes } from "./io";
import { ReadonlyDataView } from "./types";

export function readSidebarChars(
	sidebarCharsBytes: ReadonlyDataView,
	symmetryMetadataBytes: ReadonlyDataView
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

export function patchSidebarChars(
	dataView: DataView,
	sidebarCharses: readonly Level["sidebarChars"][]
) {
	const sidebarLevels = sidebarCharses.filter(isDefined);
	if (sidebarLevels.length > maxSidebars) {
		throw new Error(
			`Too many levels with sidebar graphics: ${sidebarLevels.length}. Should be max ${maxSidebars}.`
		);
	}

	dataViewSetBytes(
		dataView,
		sidebarLevels.flatMap((sidebarChars) =>
			sidebarChars.flatMap((char) =>
				char.lines.map(
					(line) =>
						(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
				)
			)
		)
	);
}
