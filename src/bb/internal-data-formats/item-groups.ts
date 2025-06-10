import { ItemCategoryName } from "../prg/data-locations";
import { PaletteIndex } from "./palette";

export type Item = {
	readonly charBlockIndex: number;
	readonly paletteIndex: PaletteIndex;
};

export type ItemGroup = ReadonlyArray<Item>;

export type ItemGroups = Record<ItemCategoryName, ItemGroup>;
