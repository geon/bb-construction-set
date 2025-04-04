import { CharBlock, CharsetChar, parseCharsetCharLine } from "../charset-char";
import { mapRecord, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import { ItemDataSegmentName } from "./data-locations";
import { DataSegment } from "./io";

export function readItems(
	dataSegments: Record<ItemDataSegmentName, DataSegment>
): Record<ItemDataSegmentName, CharBlock[]> {
	return mapRecord(dataSegments, (x, segmentName) =>
		strictChunk(
			strictChunk([...x.buffer], linesPerChar).map(
				(char): CharsetChar => ({
					lines: char.map(parseCharsetCharLine) as CharsetChar["lines"],
				})
			),
			4
		).map(segmentName === "largeLightning" ? (x) => x : unshuffleCharBlock)
	);
}

function unshuffleCharBlock(block: CharBlock): CharBlock {
	return [block[0], block[2], block[1], block[3]];
}
