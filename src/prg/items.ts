import { CharBlock } from "../charset-char";
import { readItemCharBlock } from "./charset-char";
import { itemCharsArrays } from "./data-locations";
import { makeGetBoundedByte } from "./io";
import { GetByte } from "./types";

export function readItems(getByte: GetByte): CharBlock[] {
	const items: CharBlock[] = [];
	for (const { address, numItems } of itemCharsArrays) {
		for (let itemIndex = 0; itemIndex < numItems; ++itemIndex) {
			items.push(
				unshuffleCharBlock(
					readItemCharBlock(
						makeGetBoundedByte(
							getByte,
							address + itemIndex * 4 * 8,
							4 * 8,
							"itemCharBlock"
						)
					)
				)
			);
		}
	}
	return items;
}

function unshuffleCharBlock(block: CharBlock): CharBlock {
	return [block[0], block[2], block[1], block[3]];
}
