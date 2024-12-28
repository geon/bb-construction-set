import { expect, test } from "vitest";
import { Color, hexToRgb } from "./color";

test("hexToRgb", () => {
	const color: Color = {
		r: 123,
		g: 231,
		b: 132,
	};

	const hexString = Object.values(color)
		.map((x) => x.toString(16))
		.join("");

	const hexInt = parseInt(hexString, 16);

	const rgbFromInt = hexToRgb(hexInt);

	expect(rgbFromInt).toStrictEqual(color);
});
