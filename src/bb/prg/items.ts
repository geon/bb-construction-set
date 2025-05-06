import { Char } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { mapRecord, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { DataSegment } from "./io";
import { mapTuple } from "../tuple";
import { ItemGroups, ItemGroup } from "../internal-data-formats/item";

export const itemGroupMeta = {
	bubbleBlow: {
		width: 3,
		height: 2,
		count: 12 * 2,
		hasMask: true,
	},
	bubblePop: {
		width: 3,
		height: 2,
		count: 8,
		hasMask: false,
	},
	baronVonBlubba: {
		width: 3,
		height: 2,
		count: 4 * 2,
		hasMask: true,
	},
	specialBubbles: {
		width: 3,
		height: 2,
		count: 12,
		hasMask: false,
	},
	lightning: {
		width: 2,
		height: 2,
		count: 1 * 2,
		hasMask: true,
	},
	fire: {
		width: 3,
		height: 2,
		count: 4 * 2,
		hasMask: true,
	},
	extendBubbles: {
		width: 3,
		height: 2,
		count: 20,
		hasMask: false,
	},
	stonerWeapon: {
		width: 3,
		height: 2,
		count: 2,
		hasMask: false,
	},
	drunkAndInvaderWeapon: {
		width: 2,
		height: 2,
		count: 5 * 2,
		hasMask: true,
	},
	incendoWeapon: {
		width: 2,
		height: 2,
		count: 4 * 2,
		hasMask: true,
	},
	items: {
		width: 2,
		height: 2,
		count: 58,
		hasMask: false,
	},
	largeLightning: {
		width: 5,
		height: 2,
		count: 1 * 2,
		hasMask: true,
	},
	bonusRoundCircles: {
		width: 2,
		height: 2,
		count: 3,
		hasMask: false,
	},
} as const satisfies Record<
	ItemDataSegmentName,
	{
		readonly width: number;
		readonly height: number;
		readonly count: number;
		readonly hasMask: boolean;
	}
>;

export function readItems(
	dataSegments: Record<ItemDataSegmentName, DataSegment>
): ItemGroups {
	return mapRecord(
		dataSegments,
		(dataSegment, segmentName): ItemGroup<number, number> => {
			const items = strictChunk(
				strictChunk(
					strictChunk([...dataSegment.buffer], linesPerChar).map(
						(char): Char => mapTuple(char, parseColorPixelByte)
					),
					itemGroupMeta[segmentName].height
				),
				itemGroupMeta[segmentName].width
			);

			return items;
		}
	);
}
