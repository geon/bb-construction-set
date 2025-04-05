import { CharsetChar, parseCharsetCharLine } from "../charset-char";
import { mapRecord, strictChunk } from "../functions";
import { ReadonlyTuple } from "../tuple";
import { linesPerChar } from "./charset-char";
import { ItemDataSegmentName } from "./data-locations";
import { DataSegment } from "./io";
import { assertTuple } from "../tuple";

export type Item<Height extends number, Width extends number> =
	// The chars are column-order just like in the game.
	ReadonlyTuple<ReadonlyTuple<CharsetChar, Height>, Width>;

export type ItemGroups = Record<ItemDataSegmentName, readonly Item<2, 2>[]>;

export function readItems(
	dataSegments: Record<ItemDataSegmentName, DataSegment>
): ItemGroups {
	return mapRecord(dataSegments, (dataSegment) =>
		strictChunk(
			strictChunk(
				strictChunk([...dataSegment.buffer], linesPerChar).map(
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
