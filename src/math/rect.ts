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
	gap: number
): ReadonlyArray<Coord2> {
	const axis = ({ row: "x", column: "y" } as const)[direction];

	let pos = origo;
	const positions: Array<Coord2> = [];
	for (const size of sizes) {
		positions.push(pos);

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
	gap: number
): LayoutRect {
	const childPositions = flexboxChildPositions(
		rects.map(({ size }) => size),
		direction,
		gap
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
	gap: number
): LayoutRect {
	return flexbox(
		chunk(rects, rowWidth).map((row) => flexbox(row, "row", gap)),
		"column",
		gap
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

export function leafs(rect: LayoutRect): ReadonlyArray<Rect> {
	return _leafs(rect, origo).sort((a, b) => a.index - b.index);
}
