import {
	CharsetChar,
	parseCharsetCharLine,
	ColumnCharBlock,
} from "../charset-char";
import { mapRecord, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import { ItemDataSegmentName } from "./data-locations";
import { DataSegment } from "./io";
import { assertTuple } from "../tuple";

export type Item = ColumnCharBlock;

export type ItemGroups = Record<ItemDataSegmentName, readonly Item[]>;

export function readItems(
	dataSegments: Record<ItemDataSegmentName, DataSegment>
): ItemGroups {
	return mapRecord(dataSegments, (x) =>
		strictChunk(
			strictChunk(
				strictChunk([...x.buffer], linesPerChar).map(
					(char): CharsetChar => ({
						lines: assertTuple(char.map(parseCharsetCharLine), 8),
					})
				),
				2
			),
			2
		)
	);
}
