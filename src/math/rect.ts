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
	direction: "row" | "column",
	gap: number
): ReadonlyArray<Rect> {
	const axis = ({ row: "x", column: "y" } as const)[direction];

	let pos = origo;
	const rects: Array<Rect> = [];
	for (const size of sizes) {
		rects.push({
			pos,
			size,
		});

		const offsetDistance = size[axis] + gap;
		const offsetVector: Coord2 = { x: 0, y: 0, [axis]: offsetDistance };
		pos = add(pos, offsetVector);
	}

	return rects;
}

export function boundingBox(rects: ReadonlyArray<Rect>): Rect | undefined {
	return rects[0];
}
