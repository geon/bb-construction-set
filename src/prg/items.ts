import { CharBlock, parseCharsetCharLine } from "../charset-char";
import { chunk } from "../functions";
import { linesPerChar } from "./charset-char";
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
						makeGetBoundedByte({
							getByte,
							startAddress: address + itemIndex * 4 * 8,
							length: 4 * 8,
							segmentName: "itemCharBlock",
						})
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

function readItemCharBlock(getByte: GetByte): CharBlock {
	function getBytes(getByte: GetByte, length: number): readonly number[] {
		const bytes = Array<number>(length);
		for (let index = 0; index < length; ++index) {
			bytes[index] = getByte(index);
		}
		return bytes;
	}

	return chunk(getBytes(getByte, 4 * linesPerChar), linesPerChar).map(
		(char) => ({ lines: char.map(parseCharsetCharLine) })
	) as CharBlock;
}
