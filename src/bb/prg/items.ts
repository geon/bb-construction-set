import { mapRecord } from "../functions";
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
		(subSegments): ItemGroup => ({
			charBlockIndices: [...subSegments.charBlockIndices.buffer],
			paletteIndices: [...subSegments.colorIndices.buffer].map(
				// The top bit controls multicolor.
				(byte) => (byte & 0b111) as PaletteIndex
			),
		})
	);
}
