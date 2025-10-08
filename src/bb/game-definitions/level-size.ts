import { Coord2 } from "../../math/coord2";

export const levelWidth = 32;
export const levelHeight = 25;

export const levelSize = {
	x: levelWidth,
	y: levelHeight,
} as const satisfies Coord2;
