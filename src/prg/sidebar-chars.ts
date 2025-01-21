import { Level } from "../level";
import { isBitSet } from "./bit-twiddling";
import { readCharBlock } from "./charset-char";
import { symmetryMetadataArrayAddress } from "./data-locations";
import { GetByte } from "./types";

export function readSidebarChars(
	levelIndex: number,
	currentSidebarAddress: number,
	getByte: GetByte
) {
	const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);

	let sidebarChars: Level["sidebarChars"] = undefined;
	if (!isBitSet(symmetryMetadata, 1)) {
		sidebarChars = readCharBlock(getByte, currentSidebarAddress);
		currentSidebarAddress += 4 * 8; // 4 chars of 8 bytes each.
	}
	return { sidebarChars, currentSidebarAddress };
}
