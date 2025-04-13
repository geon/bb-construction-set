import { add, Coord2, origo } from "./coord2";

export type Rect = {
	/** top left */
	readonly pos: Coord2;
	readonly size: Coord2;
};

export function bottomRight(rect: Rect): Coord2 {
	return add(rect.pos, rect.size);
}

export function flexbox(
	sizes: ReadonlyArray<Coord2>,
	_direction: "row" | "column",
	_gap: number
): ReadonlyArray<Rect> {
	const rects: Array<Rect> = [];
	for (const size of sizes) {
		rects.push({
			pos: origo,
			size,
		});
	}

	return rects;
}
