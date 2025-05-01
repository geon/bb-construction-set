import { expect, test } from "vitest";
import {
	parsePixelSprite,
	parseSprite,
	serializePixelSprite,
	serializeSprite,
} from "../sprites";
import { PixelSprite, Sprite } from "../../internal-data-formats/sprite";

const spriteBytes: Sprite = [
	0, 42, 0, 2, 170, 160, 10, 170, 168, 10, 166, 168, 10, 153, 168, 10, 154, 168,
	10, 153, 168, 10, 166, 168, 10, 170, 168, 10, 170, 168, 10, 170, 168, 2, 42,
	32, 2, 8, 32, 0, 136, 128, 0, 136, 128, 0, 51, 0, 0, 51, 0, 0, 63, 0, 0, 63,
	0, 0, 63, 0, 0, 63, 0,
];

// Same format.
const sprite: Sprite = spriteBytes;

const pixelSprite: PixelSprite = [
	[0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
	[0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0],
	[0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 2, 1, 2, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 1, 2, 1, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 1, 2, 1, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 2, 1, 2, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
	[0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
	[0, 0, 0, 2, 0, 2, 2, 2, 0, 2, 0, 0],
	[0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0],
	[0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 0, 0],
	[0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 0, 0],
	[0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
];

test("parseSprite", () => {
	expect(parseSprite(spriteBytes)).toStrictEqual(sprite);
});

test("serializeSprite", () => {
	expect(serializeSprite(sprite)).toStrictEqual(spriteBytes);
});

test("parsePixelSprite", () => {
	expect(parsePixelSprite(spriteBytes)).toStrictEqual(pixelSprite);
});

test("serializePixelSprite", () => {
	expect(serializePixelSprite(pixelSprite)).toStrictEqual(spriteBytes);
});
