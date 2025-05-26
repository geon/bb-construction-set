import { checkedAccess, mapRecord, zipObject } from "../functions";
import { ItemGroups } from "../internal-data-formats/item-groups";
import { PaletteImage, drawGrid, paletteImageFlexBox } from "./palette-image";
import { CharBlock } from "../internal-data-formats/char-group";
import { drawCharBlock, getCharPalette } from "./char";
import { Level } from "../internal-data-formats/level";

export function drawItemsToCanvas(
	itemGroups: ItemGroups,
	charBlocks: ReadonlyArray<CharBlock<2, 2>>,
	bgColors: Pick<Level, "bgColorDark" | "bgColorLight">
): PaletteImage {
	const itemImages = mapRecord(itemGroups, (itemGroup) => {
		return zipObject({
			charBlockIndex: itemGroup.charBlockIndices,
			paletteIndex: itemGroup.paletteIndices,
		}).map((item) =>
			drawCharBlock(
				checkedAccess(charBlocks, item.charBlockIndex),
				getCharPalette(item.paletteIndex, bgColors)
			)
		);
	});

	return paletteImageFlexBox(
		[
			drawGrid(itemImages.points, 8, { x: 8, y: 16 }, { x: 4, y: 8 }),
			drawGrid(itemImages.powerups, 8, { x: 8, y: 16 }, { x: 4, y: 8 }),
		],
		"column",
		8 * 3
	);
}
