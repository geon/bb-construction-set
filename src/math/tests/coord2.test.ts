import { expect, test } from "vitest";
import {
	add,
	Coord2,
	distance,
	interpolate,
	magnitude,
	normalize,
	scale,
	subtract,
} from "../coord2";

test("snapshot", () => {
	const a: Coord2 = { x: 3, y: 4 };
	const b: Coord2 = { x: 30, y: 40 };
	expect([
		add(a, b),
		subtract(a, b),
		scale(a, 3),
		magnitude(a),
		distance(a, b),
		normalize({ x: 2, y: 0 }),
		interpolate(a, b, 0.5),
	]).toMatchSnapshot();
});
