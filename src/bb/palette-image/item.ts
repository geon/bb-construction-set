import { checkedAccess } from "../functions";
import { Item } from "../internal-data-formats/item-groups";
import { PaletteImage } from "./palette-image";
import { CharBlock } from "../internal-data-formats/char-group";
import { drawCharBlock, getCharPalette } from "./char";
import { Level } from "../internal-data-formats/level";

export function drawItem(
	item: Item,
	charBlocks: ReadonlyArray<CharBlock<2, 2>>,
	bgColors: Pick<Level, "bgColorDark" | "bgColorLight">
): PaletteImage {
	return drawCharBlock(
		checkedAccess(charBlocks, item.charBlockIndex),
		getCharPalette(item.paletteIndex, bgColors)
	);
}
