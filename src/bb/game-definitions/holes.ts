import { Rect } from "../../math/rect";

export type HoleRects = Record<
	"top" | "bottom",
	Record<"left" | "right", Rect>
>;

export const size = {
	x: 4,
	y: 1,
};

export const left = 9;
export const right = 19;
export const top = 0;
export const bottom = 24;

export const holeRects: HoleRects = {
	top: {
		left: { pos: { x: left, y: top }, size },
		right: { pos: { x: right, y: top }, size },
	},
	bottom: {
		left: { pos: { x: left, y: bottom }, size },
		right: { pos: { x: right, y: bottom }, size },
	},
};
