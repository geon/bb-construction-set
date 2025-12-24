import { Color, hexToRgb } from "../../math/color";
import { mapTuple, Tuple } from "../tuple";

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
export type Palette = Tuple<Color, 16>;

export const rgbPalette: Palette = mapTuple(
	[
		// https://www.pepto.de/projects/colorvic/2001
		0x000000, 0xffffff, 0x68372b, 0x70a4b2, 0x6f3d86, 0x588d43, 0x352879,
		0xb8c76f, 0x6f4f25, 0x433900, 0x9a6759, 0x444444, 0x6c6c6c, 0x9ad284,
		0x6c5eb5, 0x959595,

		// https://www.c64-wiki.com/wiki/Color
		// 0x000000, 0xffffff, 0x880000, 0xaaffee, 0xcc44cc, 0x00cc55, 0x0000aa,
		// 0xeeee77, 0xdd8855, 0x664400, 0xff7777, 0x333333, 0x777777, 0xaaff66,
		// 0x0088ff, 0xbbbbbb,
	],
	hexToRgb
);

export const palette = {
	black: 0x0,
	white: 0x1,
	red: 0x2,
	cyan: 0x3,
	purple: 0x4,
	green: 0x5,
	blue: 0x6,
	yellow: 0x7,
	orange: 0x8,
	brown: 0x9,
	lightRed: 0xa,
	darkGrey: 0xb,
	grey: 0xc,
	lightGreen: 0xd,
	lightBlue: 0xe,
	lightGrey: 0xf,
} as const;

export const paletteMulticolor = {
	black: 0 + 8,
	white: 1 + 8,
	red: 2 + 8,
	cyan: 3 + 8,
	purple: 4 + 8,
	green: 5 + 8,
	blue: 6 + 8,
	yellow: 7 + 8,
} as const;

export interface SubPalette extends Tuple<PaletteIndex | undefined, 4> {}
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
