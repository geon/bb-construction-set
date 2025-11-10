import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { parsePrg } from "../../prg/parse-prg";
import {
	parseSprite,
	drawSprite,
	getSpritePalette,
	drawSprites,
	parseSprites,
} from "../sprite";
import { palette } from "../../internal-data-formats/palette";

test("drawSprite / parseSprite", () => {
	const bossFacingLeft = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	).sprites.bossFacingLeft;

	const sprite = bossFacingLeft.sprites[0]!;
	const spritePalette = getSpritePalette(bossFacingLeft.color);

	expect(
		parseSprite(drawSprite(sprite, spritePalette), palette.green)
	).toStrictEqual({
		sprite,
		color: spritePalette[2]!,
	});
});

test("drawSprites / parseSprites", () => {
	const sprites = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	).sprites;

	expect(parseSprites(drawSprites(sprites))).toStrictEqual(sprites);
});
