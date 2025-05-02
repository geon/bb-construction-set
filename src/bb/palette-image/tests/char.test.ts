import { expect, test } from "vitest";
import { drawChar } from "../char";

test("drawChar", () => {
	expect(
		drawChar(
			[
				[2, 1, 0, 0],
				[3, 2, 1, 0],
				[3, 3, 2, 0],
				[3, 2, 2, 1],
				[2, 2, 2, 2],
				[2, 1, 1, 2],
				[1, 1, 1, 1],
				[2, 1, 1, 1],
			],
			[0, 5, 13, 1]
		)
	).toStrictEqual([
		[13, 5, 0, 0],
		[1, 13, 5, 0],
		[1, 1, 13, 0],
		[1, 13, 13, 5],
		[13, 13, 13, 13],
		[13, 5, 5, 13],
		[5, 5, 5, 5],
		[13, 5, 5, 5],
	]);

	expect(
		drawChar(
			[
				[2, 1, 0, 0],
				[3, 2, 1, 0],
				[3, 3, 2, 0],
				[3, 2, 2, 1],
				[2, 2, 2, 2],
				[2, 1, 1, 2],
				[1, 1, 1, 1],
				[2, 1, 1, 1],
			],
			[0, 5, 13, 1],
			[
				[0, 0, 3, 3],
				[3, 0, 0, 3],
				[3, 3, 0, 0],
				[0, 3, 3, 0],
				[0, 0, 3, 3],
				[3, 0, 0, 3],
				[3, 3, 0, 0],
				[0, 3, 3, 0],
			]
		)
	).toStrictEqual([
		[13, 5, undefined, undefined],
		[undefined, 13, 5, undefined],
		[undefined, undefined, 13, 0],
		[1, undefined, undefined, 5],
		[13, 13, undefined, undefined],
		[undefined, 5, 5, undefined],
		[undefined, undefined, 5, 5],
		[13, undefined, undefined, 5],
	]);
});
