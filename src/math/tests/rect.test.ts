import { describe, expect, test } from "vitest";
import {
	bottomRight,
	boundingBox,
	flexboxChildPositions,
	rectIntersection,
} from "../rect";
import { origo } from "../coord2";

test("bottomRight", () => {
	expect(
		bottomRight({
			pos: { x: 123, y: 456 },
			size: { x: 10, y: 1 },
		})
	).toMatchSnapshot();
});

describe("flexbox", () => {
	test("length", () => {
		expect(
			flexboxChildPositions([{ x: 1, y: 1 }], "row", 0).length
		).toStrictEqual(1);
		expect(
			flexboxChildPositions(
				[
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				0
			).length
		).toStrictEqual(3);
	});

	test("first pos", () => {
		expect(flexboxChildPositions([{ x: 1, y: 1 }], "row", 0)[0]).toStrictEqual(
			origo
		);
	});

	test("accumulated x-pos", () => {
		expect(
			flexboxChildPositions(
				[
					{ x: 123, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				0
			)[2]?.x
		).toStrictEqual(124);
	});

	test("no y-pos", () => {
		expect(
			flexboxChildPositions(
				[
					{ x: 123, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				0
			)[2]?.y
		).toStrictEqual(0);
	});

	test("gap", () => {
		expect(
			flexboxChildPositions(
				[
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				1
			)[2]?.x
		).toStrictEqual(4);
	});

	test("column", () => {
		expect(
			flexboxChildPositions(
				[
					{ x: 123, y: 1 },
					{ x: 1, y: 10 },
					{ x: 1, y: 1 },
				],
				"column",
				1
			)
		).toMatchInlineSnapshot(`
			[
			  {
			    "x": 0,
			    "y": 0,
			  },
			  {
			    "x": 0,
			    "y": 2,
			  },
			  {
			    "x": 0,
			    "y": 13,
			  },
			]
		`);
	});
});

describe("boundingBox", () => {
	test("one", () => {
		const rect = { pos: { x: 1, y: 1 }, size: { x: 1, y: 1 } };
		expect(boundingBox([rect])).toStrictEqual(rect);
	});

	test("largest containing", () => {
		const rects = [
			{ pos: { x: 1, y: 1 }, size: { x: 1, y: 1 } },
			{ pos: { x: 0, y: 0 }, size: { x: 3, y: 3 } },
		];
		expect(boundingBox(rects)).toStrictEqual(rects[1]);
	});

	test("side by side", () => {
		const rects = [
			{ pos: { x: 0, y: 0 }, size: { x: 1, y: 1 } },
			{ pos: { x: 2, y: 0 }, size: { x: 1, y: 1 } },
		];
		expect(boundingBox(rects)).toStrictEqual({
			pos: { x: 0, y: 0 },
			size: { x: 3, y: 1 },
		});
	});

	test("random", () => {
		const rects = [
			{ pos: { x: 1, y: 1 }, size: { x: 1, y: 1 } },
			{ pos: { x: 10, y: 12 }, size: { x: 4, y: 5 } },
			{ pos: { x: -1, y: 4 }, size: { x: 1, y: 2 } },
			{ pos: { x: 3, y: 1 }, size: { x: 4, y: 1 } },
			{ pos: { x: 0, y: 2 }, size: { x: 3, y: 3 } },
		];
		expect(boundingBox(rects)).toMatchSnapshot();
	});
});

describe("rectIntersection", () => {
	test("same", () => {
		const a = { pos: { x: 0, y: 0 }, size: { x: 2, y: 2 } };
		const b = { pos: { x: 0, y: 0 }, size: { x: 2, y: 2 } };
		expect(rectIntersection(a, b)).toStrictEqual(a);
	});

	test("+x +y", () => {
		const a = { pos: { x: 0, y: 0 }, size: { x: 2, y: 2 } };
		const b = { pos: { x: 1, y: 1 }, size: { x: 2, y: 2 } };
		expect(rectIntersection(a, b)).toStrictEqual({
			pos: { x: 1, y: 1 },
			size: { x: 1, y: 1 },
		});
	});
});
