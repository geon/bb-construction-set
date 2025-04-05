import {
	CharBlock,
	CharsetChar,
	parseCharsetCharLine,
	RowCharBlock,
} from "../charset-char";
import { mapRecord, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import { ItemDataSegmentName } from "./data-locations";
import { DataSegment } from "./io";
import { assertTuple } from "../tuple";

export type ItemGroups = Record<ItemDataSegmentName, readonly RowCharBlock[]>;

export function readItems(
	dataSegments: Record<ItemDataSegmentName, DataSegment>
): ItemGroups {
	return mapRecord(dataSegments, (x, segmentName) =>
		strictChunk(
			strictChunk([...x.buffer], linesPerChar).map(
				(char): CharsetChar => ({
					lines: assertTuple(char.map(parseCharsetCharLine), 8),
				})
			),
			4
		)
			.map(segmentName === "largeLightning" ? (x) => x : unshuffleCharBlock)
			.map(
				([topLeft, topRight, bottomLeft, BottomRight]): RowCharBlock => [
					[topLeft, topRight],
					[bottomLeft, BottomRight],
				]
			)
	);
}

function unshuffleCharBlock(block: CharBlock): CharBlock {
	return [block[0], block[2], block[1], block[3]];
}
