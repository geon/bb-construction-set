import { expect, test } from "vitest";
import { parseSprite, serializeSprite } from "../sprites";
import { Sprite } from "../../internal-data-formats/sprite";

const spriteBytes: Sprite = [
	0, 42, 0, 2, 170, 160, 10, 170, 168, 10, 166, 168, 10, 153, 168, 10, 154, 168,
	10, 153, 168, 10, 166, 168, 10, 170, 168, 10, 170, 168, 10, 170, 168, 2, 42,
	32, 2, 8, 32, 0, 136, 128, 0, 136, 128, 0, 51, 0, 0, 51, 0, 0, 63, 0, 0, 63,
	0, 0, 63, 0, 0, 63, 0,
];

// Same format.
const sprite: Sprite = spriteBytes;

test("parseSprite", () => {
	expect(parseSprite(spriteBytes)).toStrictEqual(sprite);
});

test("serializeSprite", () => {
	expect(serializeSprite(sprite)).toStrictEqual(spriteBytes);
});
