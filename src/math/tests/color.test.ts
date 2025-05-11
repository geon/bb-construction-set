import { expect, test } from "vitest";
import { distance } from "../color";

test("distance", () => {
	expect(distance({ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 })).toStrictEqual(0);
	expect(distance({ r: 0, g: 0, b: 0 }, { r: 5, g: 0, b: 0 })).toStrictEqual(5);
	expect(distance({ r: 5, g: 0, b: 0 }, { r: 0, g: 0, b: 0 })).toStrictEqual(5);
	expect(distance({ r: 0, g: 0, b: 5 }, { r: 0, g: 0, b: 0 })).toStrictEqual(5);
	expect(distance({ r: 3, g: 4, b: 0 }, { r: 0, g: 0, b: 0 })).toStrictEqual(5);
});
