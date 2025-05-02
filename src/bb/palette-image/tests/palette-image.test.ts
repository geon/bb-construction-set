import { expect, test } from "vitest";
import { blitPaletteImage, PaletteImage } from "../palette-image";

test("blitPaletteImage", () => {
	const image: PaletteImage = {
		width: 4,
		height: 4,
		data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	};

	blitPaletteImage(
		image,
		{
			width: 2,
			height: 2,
			data: [1, 1, 1, 1],
		},
		{ x: 0, y: 0 }
	);

	expect(image).toStrictEqual({
		width: 4,
		height: 4,
		data: [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	});

	blitPaletteImage(
		image,
		{
			width: 2,
			height: 2,
			data: [2, 2, 2, 2],
		},
		{ x: 1, y: 1 }
	);

	expect(image).toStrictEqual({
		width: 4,
		height: 4,
		data: [1, 1, 0, 0, 1, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0],
	});

	blitPaletteImage(
		image,
		{
			width: 2,
			height: 2,
			data: [3, undefined, undefined, 3],
		},
		{ x: 2, y: 2 }
	);

	expect(image).toStrictEqual({
		width: 4,
		height: 4,
		data: [1, 1, 0, 0, 1, 2, 2, 0, 0, 2, 3, 0, 0, 0, 0, 3],
	});
});
