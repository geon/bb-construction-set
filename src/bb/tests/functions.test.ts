import { expect, test } from "vitest";
import { chunk, padRight, unzipObject, zipObject } from "../functions";

test("padRight", () => {
	expect(padRight([1, 2, 3], 5, 0)).toStrictEqual([1, 2, 3, 0, 0]);
});

test("chunk", () => {
	expect(chunk([1, 2, 3, 4, 5], 2)).toStrictEqual([[1, 2], [3, 4], [5]]);
});

test("zipObject", () => {
	expect(zipObject({ foo: [1, 2, 3], bar: ["a", "b", "c"] })).toStrictEqual([
		{ foo: 1, bar: "a" },
		{ foo: 2, bar: "b" },
		{ foo: 3, bar: "c" },
	]);
});

test("unzipObject", () => {
	expect(
		unzipObject([
			{ foo: 1, bar: "a" },
			{ foo: 2, bar: "b" },
			{ foo: 3, bar: "c" },
		])
	).toStrictEqual({ foo: [1, 2, 3], bar: ["a", "b", "c"] });
});
