import { expect, test } from "vitest";
import {
	blitPaletteImage,
	cropPaletteImage,
	PaletteImage,
} from "../palette-image";

test("blitPaletteImage", () => {
	const image: PaletteImage = [
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];

	blitPaletteImage(
		image,
		[
			[1, 1],
			[1, 1],
		],
		{ x: 0, y: 0 }
	);

	expect(image).toStrictEqual([
		[1, 1, 0, 0],
		[1, 1, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	]);

	blitPaletteImage(
		image,
		[
			[2, 2],
			[2, 2],
		],
		{ x: 1, y: 1 }
	);

	expect(image).toStrictEqual([
		[1, 1, 0, 0],
		[1, 2, 2, 0],
		[0, 2, 2, 0],
		[0, 0, 0, 0],
	]);

	blitPaletteImage(
		image,
		[
			[3, undefined],
			[undefined, 3],
		],
		{ x: 2, y: 2 }
	);

	expect(image).toStrictEqual([
		[1, 1, 0, 0],
		[1, 2, 2, 0],
		[0, 2, 3, 0],
		[0, 0, 0, 3],
	]);
});

test("cropPaletteImage", () => {
	const image: PaletteImage = [
		[1, 1, 0, 0],
		[1, 2, 2, 0],
		[0, 2, 3, 0],
		[0, 0, 0, 3],
	];

	expect(
		cropPaletteImage(image, {
			pos: { x: 1, y: 0 },
			size: { x: 2, y: 2 },
		})
	).toStrictEqual([
		[1, 0],
		[2, 2],
	]);

	expect(() =>
		cropPaletteImage(image, {
			pos: { x: 3, y: 0 },
			size: { x: 2, y: 2 },
		})
	).toThrow();
});
