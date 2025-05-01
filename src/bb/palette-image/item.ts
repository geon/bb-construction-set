import { Coord2, origo } from "../../math/coord2";
import { LayoutRect, boundingBox, flexbox, grid } from "../../math/rect";
import { mapRecord, range, zipObject, unzipObject } from "../functions";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { itemGroupMeta } from "../prg/items";
import { ItemGroups, ItemGroup } from "../internal-data-formats/item";
import { assertTuple } from "../tuple";
import { drawLayout, PaletteImage } from "./palette-image";
import { drawChar } from "./char";

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

function layOutItemChars(): LayoutRect {
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
				bubbleBlow: 4,
				bubblePop: 4,
				specialBubbles: 4,
				extendBubbles: 4,
				items: Math.ceil(Math.sqrt(itemRectGroups.items.length)),
			}[groupName as string] ?? 1000,
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
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		4 * 4
	);
}

function getAllItemChars(itemGroups: ItemGroups): ReadonlyArray<PaletteImage> {
	const sharedBubbleMask = assertTuple(
		itemGroups.bubbleBlow.slice(8).map((x) => x.mask!),
		4
	);
	const overriddenMasks: Partial<
		Record<
			ItemDataSegmentName,
			ReadonlyArray<(typeof sharedBubbleMask)[number]>
		>
	> = {
		specialBubbles: range(0, 3).flatMap(() => sharedBubbleMask),
		extendBubbles: range(0, 5).flatMap(() => sharedBubbleMask),
		stonerWeapon: [sharedBubbleMask[0], sharedBubbleMask[2]],
	};

	const maskedItemGroups = mapRecord(
		itemGroups,
		(itemGroup, groupName): ItemGroup<number, number> => {
			const masks = overriddenMasks[groupName];
			return masks
				? zipObject({
						item: itemGroup.map(({ item }) => item),
						mask: masks,
				  })
				: itemGroup;
		}
	);

	return Object.values(
		mapRecord(maskedItemGroups, (maskedItems) => {
			const { item: items, mask: itemMasks } = unzipObject(maskedItems);
			const chars = items.flat().flat();
			const masks = itemMasks?.flat().flat() ?? chars.map(() => undefined);
			const maskedChars = zipObject({
				char: chars,
				mask: masks,
			});

			return maskedChars.map((maskedChar) =>
				drawChar(
					maskedChar.char,
					[
						0, //black
						9, // Brown
						1, // White
						5, // Green
					],
					maskedChar.mask
				)
			);
		})
	).flat();
}

export function drawItems(itemGroups: ItemGroups): PaletteImage {
	const charImages = getAllItemChars(itemGroups);
	const layout = layOutItemChars();
	return drawLayout(layout, charImages);
}
