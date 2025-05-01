import { expect, test } from "vitest";
import { parseColorPixelByte } from "../color-pixel-byte";

test("parseColorPixelByte", () => {
	expect(parseColorPixelByte(0b00011011)).toStrictEqual([0, 1, 2, 3]);
});
