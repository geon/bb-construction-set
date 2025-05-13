import { Coord2, origo } from "../../math/coord2";
import { LayoutRect, boundingBox, flexbox, grid } from "../../math/rect";
import {
	mapRecord,
	padRight,
	range,
	strictChunk,
	zipObject,
} from "../functions";
import { itemGroupMeta } from "../prg/items";
import { Item, ItemGroup, ItemGroups } from "../internal-data-formats/item";
import { drawLayout, PaletteImage, parseLayout } from "./palette-image";
import { drawChar, parseChar } from "./char";
import { assertTuple } from "../tuple";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { Char } from "../internal-data-formats/char";
import { PaletteIndex, SubPalette } from "../internal-data-formats/palette";

function layoutLargeLightning(index: number) {
	// 4x4 grid, but 2 corners are missing 3 chars each.
	// [o][o][x][x]
	// [x][x][x][o]
	// [o][x][x][x]
	// [x][x][o][o]
	const positions: ReadonlyArray<Coord2> = [
		{ x: 2, y: 0 },
		{ x: 3, y: 0 },
		{ x: 0, y: 1 },
		{ x: 1, y: 1 },
		{ x: 2, y: 1 },
		{ x: 1, y: 2 },
		{ x: 2, y: 2 },
		{ x: 3, y: 2 },
		{ x: 0, y: 3 },
		{ x: 1, y: 3 },
	];

	const { width, height } = itemGroupMeta.largeLightning;
	if (positions.length !== width * height) {
		throw new Error(
			`Bad char count for largeLightning. Was ${positions.length}, should be ${
				width * height
			}.`
		);
	}

	const children = positions.map(
		(pos): LayoutRect => ({
			pos: { x: pos.x * 4, y: pos.y * 8 },
			size: { x: 4, y: 8 },
			index: index++,
		})
	);

	return {
		...boundingBox(children),
		children,
	};
}

export function layOutItemChars(): LayoutRect {
	let index = 0;
	const itemRectGroups = mapRecord(
		itemGroupMeta,
		(group, groupName): ReadonlyArray<LayoutRect> =>
			range(0, group.count).map(() => {
				if (groupName === "largeLightning") {
					const layout = layoutLargeLightning(index);
					index += layout.children.length;
					return layout;
				}

				return flexbox(
					range(0, group.width).map(
						(): LayoutRect =>
							flexbox(
								range(0, group.height).map(
									(): LayoutRect => ({
										pos: origo,
										size: { x: 4, y: 8 },
										index: index++,
									})
								),
								"column",
								0
							)
					),
					"row",
					0
				);
			})
	);

	const laidOutItemGroups = mapRecord(itemRectGroups, (itemRects, groupName) =>
		grid(
			itemRects,
			{
				drunkAndInvaderWeapon: 5,
				lightning: 1,
				items: Math.ceil(Math.sqrt(itemRectGroups.items.length)),
			}[groupName as string] ?? 4,
			{ x: 4, y: 8 }
		)
	);

	return flexbox(
		[
			[
				laidOutItemGroups.bubbleBlow,
				laidOutItemGroups.specialBubbles,
				laidOutItemGroups.extendBubbles,
			],
			[
				laidOutItemGroups.bubblePop,
				laidOutItemGroups.fire,
				laidOutItemGroups.baronVonBlubba,
				laidOutItemGroups.stonerWeapon,
				laidOutItemGroups.drunkAndInvaderWeapon,
				flexbox(
					[laidOutItemGroups.incendoWeapon, laidOutItemGroups.lightning],
					"row",
					4
				),
			],
			[
				laidOutItemGroups.items,
				laidOutItemGroups.bonusRoundCircles,
				laidOutItemGroups.largeLightning,
				laidOutItemGroups.flowingWater,
				laidOutItemGroups.fireOnGround,
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		4 * 4
	);
}

export function getAllItemChars(itemGroups: ItemGroups): ReadonlyArray<Char> {
	return Object.values(mapRecord(itemGroups, (items) => items)).flat(3);
}

export function getAllItemCharMasks(
	itemGroups: ItemGroups
): ReadonlyArray<Char | undefined> {
	const sharedBubbleMask = assertTuple(itemGroups.bubbleBlow.slice(12 + 8), 4);
	const bubbleBasedMasks: Partial<
		Record<ItemDataSegmentName, ReadonlyArray<Item<number, number>>>
	> = {
		specialBubbles: range(0, 3).flatMap(() => sharedBubbleMask),
		extendBubbles: range(0, 5).flatMap(() => sharedBubbleMask),
		stonerWeapon: [sharedBubbleMask[0], sharedBubbleMask[2]],
	};

	return Object.values(
		mapRecord(itemGroups, (items, groupName) => {
			const mixedChars = items.flat().flat();

			const masks = padRight(
				itemGroupMeta[groupName].hasMask
					? mixedChars.slice(mixedChars.length / 2)
					: bubbleBasedMasks[groupName]?.flat().flat() ?? [],
				mixedChars.length,
				undefined
			);

			return masks;
		})
	).flat();
}

export function getAllItemCharPalettes(): ReadonlyArray<SubPalette> {
	return Object.values(
		mapRecord(itemGroupMeta, (meta) => {
			const palette: SubPalette = [
				0, //black
				9, // Brown
				1, // White
				5,
			];

			const numChars = meta.count * meta.width * meta.height;
			return range(0, numChars).map(() => palette);
		})
	).flat();
}

export function drawItems(itemGroups: ItemGroups): PaletteImage {
	const charImages = zipObject({
		char: getAllItemChars(itemGroups),
		mask: getAllItemCharMasks(itemGroups),
		palette: getAllItemCharPalettes(),
	}).map((maskedChar) =>
		drawChar(maskedChar.char, maskedChar.palette, maskedChar.mask)
	);
	const layout = layOutItemChars();
	return drawLayout(layout, charImages);
}

function reassembleAllItemChars(
	chars: readonly { char: Char; color: PaletteIndex | undefined }[]
): ItemGroups {
	let groupStart = 0;
	return mapRecord(itemGroupMeta, (meta): ItemGroup<number, number> => {
		const groupEnd = groupStart + meta.count * meta.width * meta.height;
		const groupChars = chars
			.slice(groupStart, groupEnd)
			.map(({ char }) => char);
		groupStart = groupEnd;

		return strictChunk(strictChunk(groupChars, meta.height), meta.width);
	});
}

export function parseItems(image: PaletteImage): ItemGroups {
	const layout = layOutItemChars();

	const chars = zipObject({
		image: parseLayout(layout, image),
		palette: getAllItemCharPalettes(),
	}).map(({ image, palette }) =>
		parseChar(image as PaletteImage<4, 8>, palette)
	);
	return reassembleAllItemChars(chars);
}
