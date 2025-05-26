import { ItemCategoryName } from "../prg/data-locations";
import { PaletteIndex } from "./palette";

export type ItemGroup = {
	readonly charBlockIndices: ReadonlyArray<number>;
	readonly paletteIndices: ReadonlyArray<PaletteIndex>;
};

export type ItemGroups = Record<ItemCategoryName, ItemGroup>;
