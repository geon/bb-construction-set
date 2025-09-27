import { expect, test } from "vitest";
import { distance, hexToRgb, quantize } from "../color";
import { rgbPalette } from "../../bb/internal-data-formats/palette";
import { colorNames } from "../../c64/consts";

test("distance", () => {
	expect(distance({ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 })).toStrictEqual(0);
	expect(distance({ r: 0, g: 0, b: 0 }, { r: 5, g: 0, b: 0 })).toStrictEqual(5);
	expect(distance({ r: 5, g: 0, b: 0 }, { r: 0, g: 0, b: 0 })).toStrictEqual(5);
	expect(distance({ r: 0, g: 0, b: 5 }, { r: 0, g: 0, b: 0 })).toStrictEqual(5);
	expect(distance({ r: 3, g: 4, b: 0 }, { r: 0, g: 0, b: 0 })).toStrictEqual(5);
});

test("quantize", () => {
	const colorsWithNames = [
		[0x000000, "black"],
		[0xffffff, "white"],
		[0xff0000, "red"],
		[0x00ffff, "cyan"],
		[0x880088, "purple"],
		[0x00ff00, "green"],
		[0x0000ff, "blue"],
		[0xffff00, "yellow"],
		[0xaa8800, "orange"],
		[0x664400, "brown"],
		[0x996666, "pink"],
		[0x444444, "darkGrey"],
		[0x666666, "grey"],
		[0x88ff88, "lightGreen"],
		[0x6666aa, "lightBlue"],
		[0xaaaaaa, "lightGrey"],
	] as const;

	for (const [hex, name] of colorsWithNames) {
		expect(colorNames[quantize(hexToRgb(hex), rgbPalette)]).toStrictEqual(name);
	}
});
