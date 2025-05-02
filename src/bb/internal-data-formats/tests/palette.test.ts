import { expect, test } from "vitest";
import { getSubPaletteIndex } from "../palette";

test("getSubPaletteIndex", () => {
	expect(getSubPaletteIndex(6, [5, 6, 7, 8])).toStrictEqual(1);
	expect(getSubPaletteIndex(1, [5, 6, 7, 8])).toStrictEqual(undefined);
});
