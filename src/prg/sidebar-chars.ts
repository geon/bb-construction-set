import { Level } from "../level";
import { isBitSet } from "./bit-twiddling";
import { readCharBlock } from "./charset-char";
import {
	sidebarCharArrayAddress,
	symmetryMetadataArrayAddress,
} from "./data-locations";
import { getBytes } from "./io";
import { GetByte } from "./types";

export function readSidebarChars(levelIndex: number, getByte: GetByte) {
	const symmetryMetadata = getBytes(getByte, symmetryMetadataArrayAddress, 100);

	let sidebarChars: Level["sidebarChars"] = undefined;
	if (!isBitSet(symmetryMetadata[levelIndex], 1)) {
		const numPreviousLevelsWithSidebarChars = symmetryMetadata
			.slice(0, levelIndex)
			.filter((byte) => !isBitSet(byte, 1)).length;

		const bytesPerCharBlock = 4 * 8; // 4 chars of 8 bytes each.
		const offset = numPreviousLevelsWithSidebarChars * bytesPerCharBlock;
		sidebarChars = readCharBlock(getByte, sidebarCharArrayAddress + offset);
	}

	return sidebarChars;
}
