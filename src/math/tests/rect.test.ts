import { describe, expect, test } from "vitest";
import { bottomRight, flexbox } from "../rect";

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
});
