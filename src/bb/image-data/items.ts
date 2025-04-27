import { Coord2, scale, origo } from "../../math/coord2";
import { LayoutRect, boundingBox, flexbox, grid, leafs } from "../../math/rect";
import { mapRecord, range, zipObject, unzipObject } from "../functions";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { itemGroupMeta, ItemGroups, ItemGroup } from "../prg/items";
import { assertTuple } from "../tuple";
import { drawChar } from "./char";
import { blitImageData } from "./image-data";

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
			pos: scale(pos, 8),
			size: { x: 8, y: 8 },
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
										size: { x: 8, y: 8 },
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
			8
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
					8
				),
			],
			[
				laidOutItemGroups.items,
				laidOutItemGroups.bonusRoundCircles,
				laidOutItemGroups.largeLightning,
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		4 * 8
	);
}

export function drawItems(itemGroups: ItemGroups): ImageData {
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

	const charImages = Object.values(
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

	const layout = layOutItemChars();
	const charPositions = leafs(layout).map(({ pos }) => pos);

	const image = new ImageData(layout.size.x, layout.size.y);
	for (const { charImage, pos } of zipObject({
		charImage: charImages,
		pos: charPositions,
	})) {
		blitImageData(image, charImage, pos.x, pos.y);
	}

	return image;
}
