export interface Color {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

export const black = { r: 0, g: 0, b: 0 };

export function hexToRgb(value: number): Color {
	return {
		r: (value & 0xff0000) >> 16,
		g: (value & 0xff00) >> 8,
		b: value & 0xff,
	};
}

export function mixColors(colors: readonly Color[]): Color {
	const sum = colors.reduce(
		(soFar, current) => ({
			r: soFar.r + current.r,
			g: soFar.g + current.g,
			b: soFar.b + current.b,
		}),
		black
	);
	return {
		r: sum.r / colors.length,
		g: sum.g / colors.length,
		b: sum.b / colors.length,
	};
}

export function distance(a: Color, b: Color): number {
	return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}
