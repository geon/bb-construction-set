import { expect, test } from "vitest";
import {
	chunk,
	curry,
	indexOfMinBy,
	minBy,
	padRight,
	range,
	uniqueBy,
	unzipObject,
	zipObject,
} from "../functions";

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

test("range", () => {
	expect(range(3)).toStrictEqual([0, 1, 2]);
	expect(range(3, 1)).toStrictEqual([1, 2, 3]);
});

test("curry", () => {
	const foo = (a: number, b: number, c: number) => [a, b, c];
	expect(curry(foo)(1)(2, 3)).toStrictEqual(foo(1, 2, 3));
});

test("indexOfMinBy", () => {
	expect(indexOfMinBy([5, 2, 5, 7, 3], (x) => x)).toStrictEqual(1);
});

test("minBy", () => {
	const strings = ["geon", "neon", "leon", "peon", "hello", "world"] as const;
	expect(minBy(strings, (x) => x.length)).toStrictEqual("geon");
	expect(minBy(strings, (x) => -x.length)).toStrictEqual("hello");
	expect(minBy(strings, (x) => x.charCodeAt(0))).toStrictEqual("geon");
	expect(minBy(strings, (x) => -x.charCodeAt(0))).toStrictEqual("world");
});

test("uniqueBy", () => {
	const strings = [1, 2, 3, 1, 2] as const;
	expect(uniqueBy(strings, (x) => x)).toStrictEqual([1, 2, 3]);
});
