import { mapRecord, unzipObject, zipObject } from "../functions";
import { ItemGroup, ItemGroups } from "../internal-data-formats/item-groups";
import { PaletteIndex } from "../internal-data-formats/palette";
import { ItemCategoryName } from "./data-locations";
import { DataSegment } from "./io";

export function parseItems(
	dataSegments: Record<
		ItemCategoryName,
		{
			readonly charBlockIndices: DataSegment;
			readonly colorIndices: DataSegment;
		}
	>
): ItemGroups {
	return mapRecord(
		dataSegments,
		(subSegments): ItemGroup =>
			zipObject({
				charBlockIndex: [...subSegments.charBlockIndices.buffer],
				paletteIndex: [...subSegments.colorIndices.buffer].map(
					// The top bit controls multicolor.
					(byte) => (byte & 0b111) as PaletteIndex
				),
			})
	);
}

export function serializeItems(itemGroups: ItemGroups): Record<
	ItemCategoryName,
	{
		readonly charBlockIndices: DataSegment;
		readonly colorIndices: DataSegment;
	}
> {
	return mapRecord(
		itemGroups,
		(
			itemGroup
		): {
			readonly charBlockIndices: DataSegment;
			readonly colorIndices: DataSegment;
		} => {
			const newLocal = unzipObject(itemGroup);
			return {
				charBlockIndices: {
					mask: undefined,
					buffer: new Uint8Array(newLocal.charBlockIndex),
				},
				colorIndices: {
					mask: undefined,
					buffer: new Uint8Array(
						newLocal.paletteIndex
							// Put back the multi color bit.
							.map((color) => color | 0b1000)
					),
				},
			};
		}
	);
}
