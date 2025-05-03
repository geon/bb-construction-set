import { hexToRgb } from "../../math/color";
import { mapTuple, ReadonlyTuple } from "../tuple";

// type Palette = ReadonlyTuple<Color, 16>;
export type PaletteIndex =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15;

export const palette = mapTuple(
	// https://www.pepto.de/projects/colorvic/2001
	// https://www.c64-wiki.com/wiki/Color
	[
		0x000000, 0xffffff, 0x68372b, 0x70a4b2, 0x6f3d86, 0x588d43, 0x352879,
		0xb8c76f, 0x6f4f25, 0x433900, 0x9a6759, 0x444444, 0x6c6c6c, 0x9ad284,
		0x6c5eb5, 0x959595,
	],
	hexToRgb
);

export interface SubPalette extends ReadonlyTuple<PaletteIndex, 4> {}
export type SubPaletteIndex = 0 | 1 | 2 | 3;

export function getSubPaletteIndex(
	paletteIndex: PaletteIndex,
	subPalette: SubPalette
): SubPaletteIndex | undefined {
	const subPaletteIndex = subPalette.indexOf(paletteIndex) as
		| SubPaletteIndex
		| -1;
	return subPaletteIndex === -1 ? undefined : subPaletteIndex;
}
