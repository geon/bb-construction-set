import { chunk, unzipObject } from "../bb/functions";
import { add, Coord2, origo, subtract } from "./coord2";

export type Rect = {
	/** top left */
	readonly pos: Coord2;
	readonly size: Coord2;
};

export type LayoutRect = Rect &
	(
		| {
				readonly children: ReadonlyArray<LayoutRect>;
		  }
		| {
				readonly index: number;
		  }
	);

export function bottomRight(rect: Rect): Coord2 {
	return add(rect.pos, rect.size);
}

export function flexboxChildPositions(
	sizes: ReadonlyArray<Coord2>,
	direction: "row" | "column",
	gap: number,
	alignItems: "start" | "end" = "start"
): ReadonlyArray<Coord2> {
	const axis = ({ row: "x", column: "y" } as const)[direction];
	const orthogonalAxis = ({ row: "y", column: "x" } as const)[direction];

	const end =
		alignItems === "start"
			? 0
			: boundingBox(sizes.map((size) => ({ pos: origo, size }))).size[
					orthogonalAxis
			  ];

	let pos = origo;
	const positions: Array<Coord2> = [];
	for (const size of sizes) {
		if (alignItems === "start") {
			positions.push(pos);
		} else {
			const offsetDistance = end - size[orthogonalAxis];
			const alignVector: Coord2 = {
				x: 0,
				y: 0,
				[orthogonalAxis]: offsetDistance,
			};
			positions.push(add(pos, alignVector));
		}

		const offsetDistance = size[axis] + gap;
		const offsetVector: Coord2 = { x: 0, y: 0, [axis]: offsetDistance };
		pos = add(pos, offsetVector);
	}

	return positions;
}

export function boundingBox(rects: ReadonlyArray<Rect>): Rect {
	const topLefts = rects.map((rect) => rect.pos);
	const { x: lefts, y: tops } = unzipObject(topLefts);

	const bottomRights = rects.map(bottomRight);
	const { x: rights, y: bottoms } = unzipObject(bottomRights);

	const min = {
		x: Math.min(...lefts),
		y: Math.min(...tops),
	};

	const max = {
		x: Math.max(...rights),
		y: Math.max(...bottoms),
	};

	return { pos: min, size: subtract(max, min) };
}

export function flexbox(
	rects: ReadonlyArray<LayoutRect>,
	direction: "row" | "column",
	gap: number,
	alignItems: "start" | "end" = "start"
): LayoutRect {
	const childPositions = flexboxChildPositions(
		rects.map(({ size }) => size),
		direction,
		gap,
		alignItems
	);

	const children = rects.map((rect, index) => ({
		...rect,
		pos: childPositions[index]!,
	}));

	return {
		...boundingBox(children),
		children,
	};
}

export function grid(
	rects: ReadonlyArray<LayoutRect>,
	rowWidth: number,
	gap: Coord2
): LayoutRect {
	return flexbox(
		chunk(rects, rowWidth).map((row) => flexbox(row, "row", gap.x)),
		"column",
		gap.y
	);
}

function _leafs(
	rect: LayoutRect,
	parentPos: Coord2
): Array<Rect & { readonly index: number }> {
	const rectPosInParentSpace = add(rect.pos, parentPos);

	if ("index" in rect) {
		return [
			{
				pos: rectPosInParentSpace,
				size: rect.size,
				index: rect.index,
			},
		];
	}

	return rect.children.flatMap((x) => _leafs(x, rectPosInParentSpace));
}

export function leafs(
	rect: LayoutRect
): ReadonlyArray<Rect & { index: number }> {
	return _leafs(rect, origo).sort((a, b) => a.index - b.index);
}

// Separating axis test for axis-aligned rectangles.
export function rectIntersects(a: Rect, b: Rect): boolean {
	const bra = bottomRight(a);
	const brb = bottomRight(b);

	if (b.pos.x >= bra.x) return false;
	if (brb.x <= a.pos.x) return false;

	if (b.pos.y >= bra.y) return false;
	if (brb.y <= a.pos.y) return false;

	return true;
}

export function rectIntersection(a: Rect, b: Rect): Rect | undefined {
	if (!rectIntersects(a, b)) {
		return undefined;
	}

	const bra = bottomRight(a);
	const brb = bottomRight(b);

	const left = Math.max(a.pos.x, b.pos.x);
	const width = Math.min(bra.x, brb.x) - left;
	const top = Math.max(a.pos.y, b.pos.y);
	const height = Math.min(bra.y, brb.y) - top;

	return {
		pos: { x: left, y: top },
		size: { x: width, y: height },
	};
}

export function rectContainsPoint(rect: Rect, coord: Coord2): boolean {
	return (["x", "y"] as const).every(
		(axis) =>
			coord[axis] >= rect.pos[axis] &&
			coord[axis] < rect.pos[axis] + rect.size[axis]
	);
}
