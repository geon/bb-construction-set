export type Coord2 = {
	readonly x: number;
	readonly y: number;
};

export const origo: Coord2 = { x: 0, y: 0 };

export function add(a: Coord2, b: Coord2): Coord2 {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
	};
}

export function subtract(a: Coord2, b: Coord2): Coord2 {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
	};
}

export function scale(v: Coord2, factor: number): Coord2 {
	return {
		x: v.x * factor,
		y: v.y * factor,
	};
}

export function magnitude(v: Coord2): number {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function distance(a: Coord2, b: Coord2): number {
	return magnitude(subtract(a, b));
}

export function normalize(v: Coord2): Coord2 {
	return scale(v, 1 / magnitude(v));
}

export function interpolate(from: Coord2, to: Coord2, factor: number): Coord2 {
	return add(scale(from, 1 - factor), scale(to, factor));
}

export function equal(a: Coord2, b: Coord2): boolean {
	return a.x === b.x && a.y === b.y;
}

export function floor(coord: Coord2): Coord2 {
	return {
		x: Math.floor(coord.x),
		y: Math.floor(coord.y),
	};
}

export function multiply(a: Coord2, b: Coord2): Coord2 {
	return {
		x: a.x * b.x,
		y: a.y * b.y,
	};
}

export function divide(a: Coord2, b: Coord2): Coord2 {
	return {
		x: a.x / b.x,
		y: a.y / b.y,
	};
}
