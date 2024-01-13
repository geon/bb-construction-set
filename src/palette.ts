export interface Color {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

// https://lospec.com/palette-list/commodore64
// https://www.c64-wiki.com/wiki/Color
export const palette: ReadonlyArray<Color> = [
	0x000000, 0xffffff, 0x9f4e44, 0x6abfc6, 0xa057a3, 0x5cab5e, 0x50459b,
	0xc9d487, 0xa1683c, 0x6d5412, 0xcb7e75, 0x626262, 0x898989, 0x9ae29b,
	0x887ecb, 0xadadad,
].map(hexToRgb);

function hexToRgb(value: number): Color {
	return {
		r: (value & 0xff0000) >> 16,
		g: (value & 0xff00) >> 8,
		b: value & 0xff,
	};
}
