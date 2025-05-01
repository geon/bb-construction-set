import { expect, test } from "vitest";
import {
	parseColorPixelByte,
	serializeColorPixelByte,
} from "../color-pixel-byte";

test("parseColorPixelByte", () => {
	expect(parseColorPixelByte(0b00011011)).toStrictEqual([0, 1, 2, 3]);
});

test("serializeColorPixelByte", () => {
	expect(serializeColorPixelByte([0, 1, 2, 3])).toStrictEqual(0b00011011);
});
