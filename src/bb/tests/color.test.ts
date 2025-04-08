import { expect, test } from "vitest";
import { Color, hexToRgb, mixColors } from "../internal-data-formats/color";

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

test("mixColors", () => {
	const colors: Color[] = [
		{
			r: 30,
			g: 0,
			b: 0,
		},
		{
			r: 0,
			g: 30,
			b: 0,
		},
		{
			r: 0,
			g: 0,
			b: 30,
		},
	];

	expect(mixColors(colors)).toStrictEqual({
		r: 10,
		g: 10,
		b: 10,
	});
});
