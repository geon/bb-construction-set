import { expect, test } from "vitest";
import { padRight } from "./functions";

test("padRight", () => {
	expect(padRight([1, 2, 3], 5, 0)).toStrictEqual([1, 2, 3, 0, 0]);
});
