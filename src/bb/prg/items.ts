import { mapRecord, objectEntries, unzipObject, zipObject } from "../functions";
import { ItemGroup, ItemGroups } from "../internal-data-formats/item-groups";
import { PaletteIndex } from "../internal-data-formats/palette";
import { ItemCategoryName, itemSegmentLocations } from "./data-locations";
import { DataSegment, Patch, patchFromSegment } from "./io";

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

export function getItemPatch(itemGroups: ItemGroups): Patch {
	const newItemSegments = serializeItems(itemGroups);

	return objectEntries(itemSegmentLocations).flatMap(
		([itemCategoryName, segmentLocations]) =>
			objectEntries(segmentLocations).flatMap(
				([segmentName, segmentLocation]) =>
					patchFromSegment(
						segmentLocation,
						newItemSegments[itemCategoryName][segmentName].buffer
					)
			)
	);
}
