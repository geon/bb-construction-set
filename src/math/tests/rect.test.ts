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
});
