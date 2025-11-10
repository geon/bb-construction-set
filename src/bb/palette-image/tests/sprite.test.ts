import { expect, test } from "vitest";
import { readFileSync } from "fs";
import { parsePrg } from "../../prg/parse-prg";
import { parseSprite, drawSprite, getSpritePalette } from "../sprite";

test("drawSprite / parseSprite", () => {
	const bossFacingLeft = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	).sprites.bossFacingLeft;

	const sprite = bossFacingLeft.sprites[0]!;
	const spritePalette = getSpritePalette(bossFacingLeft.color);

	expect(parseSprite(drawSprite(sprite, spritePalette))).toStrictEqual({
		sprite,
		color: spritePalette[2]!,
	});
});
