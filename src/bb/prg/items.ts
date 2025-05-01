import {
	CharsetChar,
	parseColorPixelByte,
} from "../internal-data-formats/charset-char";
import { mapRecord, strictChunk, zipObject } from "../functions";
import { ReadonlyTuple } from "../tuple";
import { linesPerChar } from "./charset-char";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { DataSegment } from "./io";
import { mapTuple } from "../tuple";

export const itemGroupMeta = {
	bubbleBlow: {
		width: 3,
		height: 2,
		count: 12,
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
		count: 4,
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
		count: 1,
		hasMask: true,
	},
	fire: {
		width: 3,
		height: 2,
		count: 4,
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
		count: 5,
		hasMask: true,
	},
	incendoWeapon: {
		width: 2,
		height: 2,
		count: 4,
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
		count: 1,
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

export type Item<Height extends number, Width extends number> =
	// The chars are column-order just like in the game.
	ReadonlyTuple<ReadonlyTuple<CharsetChar, Height>, Width>;

export type ItemGroup<
	Width extends number,
	Height extends number
> = ReadonlyArray<{
	readonly item: Item<Height, Width>;
	readonly mask?: Item<Height, Width>;
}>;

export type ItemGroups = {
	readonly [Key in ItemDataSegmentName]: ItemGroup<number, number>;
};

export function readItems(
	dataSegments: Record<ItemDataSegmentName, DataSegment>
): ItemGroups {
	return mapRecord(
		dataSegments,
		(dataSegment, segmentName): ItemGroup<number, number> => {
			const items = strictChunk(
				strictChunk(
					strictChunk([...dataSegment.buffer], linesPerChar).map(
						(char): CharsetChar => ({
							lines: mapTuple(char, parseColorPixelByte),
						})
					),
					itemGroupMeta[segmentName].height
				),
				itemGroupMeta[segmentName].width
			);

			return itemGroupMeta[segmentName].hasMask
				? zipObject({
						item: items.slice(0, items.length / 2),
						mask: items.slice(items.length / 2),
				  })
				: items.map((item) => ({ item }));
		}
	);
}
