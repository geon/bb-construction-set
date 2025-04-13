import { describe, expect, test } from "vitest";
import { bottomRight, flexbox } from "../rect";
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
		expect(flexbox([{ x: 1, y: 1 }], "row", 0).length).toStrictEqual(1);
		expect(
			flexbox(
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
		expect(flexbox([{ x: 1, y: 1 }], "row", 0)[0]?.pos).toStrictEqual(origo);
	});

	test("use size", () => {
		expect(
			flexbox(
				[
					{ x: 1, y: 1 },
					{ x: 2, y: 3 },
				],
				"row",
				0
			).map((x) => x.size)
		).toStrictEqual([
			{ x: 1, y: 1 },
			{ x: 2, y: 3 },
		]);
	});

	test("accumulated x-pos", () => {
		expect(
			flexbox(
				[
					{ x: 123, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				0
			)[2]?.pos.x
		).toStrictEqual(124);
	});

	test("no y-pos", () => {
		expect(
			flexbox(
				[
					{ x: 123, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				0
			)[2]?.pos.y
		).toStrictEqual(0);
	});

	test("gap", () => {
		expect(
			flexbox(
				[
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
					{ x: 1, y: 1 },
				],
				"row",
				1
			)[2]?.pos.x
		).toStrictEqual(4);
	});

	test("column", () => {
		expect(
			flexbox(
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
			    "pos": {
			      "x": 0,
			      "y": 0,
			    },
			    "size": {
			      "x": 123,
			      "y": 1,
			    },
			  },
			  {
			    "pos": {
			      "x": 0,
			      "y": 2,
			    },
			    "size": {
			      "x": 1,
			      "y": 10,
			    },
			  },
			  {
			    "pos": {
			      "x": 0,
			      "y": 13,
			    },
			    "size": {
			      "x": 1,
			      "y": 1,
			    },
			  },
			]
		`);
	});
});
