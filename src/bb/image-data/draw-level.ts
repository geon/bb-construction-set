import { levelToCharNames, makeCharset } from "../internal-data-formats/level";
import {
	levelHeight,
	levelSize,
	levelWidth,
} from "../game-definitions/level-size";
import { rgbPalette, SubPalette } from "../internal-data-formats/palette";
import { Color, mixColors } from "../../math/color";
import { Char } from "../internal-data-formats/char";
import { spritePosOffset, spriteSizePixels } from "../../c64/consts";
import { pl1, pl2 } from "../game-definitions/character-name";
import { chunk, isDefined, mapRecord, range } from "../functions";
import { add, scale, subtract } from "../../math/coord2";
import { getLevelCharPalette } from "../palette-image/char";
import * as ImageDataFunctions from "./image-data";
import { ParsedPrg } from "../internal-data-formats/parsed-prg";
import { assertTuple } from "../tuple";

export function drawLevels(parsedPrg: ParsedPrg): ImageData {
	const gap = { x: 10, y: 10 };

	return ImageDataFunctions.drawGrid(
		range(100).map((levelIndex) => drawLevelThumbnail(parsedPrg, levelIndex)),
		10,
		levelSize,
		gap
	);
}

export function drawLevelThumbnail(
	parsedPrg: ParsedPrg,
	levelIndex: number
): ImageData {
	const shadowChars = assertTuple(parsedPrg.chars.shadows.flat().flat(), 6);
	const spriteColors = mapRecord(parsedPrg.sprites, ({ color }) => color);
	const level = parsedPrg.levels[levelIndex]!;

	const image = new ImageData(levelWidth, levelHeight);

	// Draw level.
	const charPalette = getLevelCharPalette(level.bgColors);
	const charset = makeCharset(level, shadowChars);
	const averageCharColors = mapRecord(charset, (char) =>
		getAverageCharColor(char, charPalette)
	);
	const tiles = chunk(
		levelToCharNames(level)
			.flat()
			.map((charName) => averageCharColors[charName]),
		levelWidth
	);
	for (const [tileY, row] of tiles.entries()) {
		for (const [tileX, color] of row.entries()) {
			const pixelIndex = tileY * levelWidth + tileX;
			ImageDataFunctions.plotPixel(image, pixelIndex, color);
		}
	}

	const charBlockSize = { x: 16, y: 16 };
	const fakeSpriteCharblockOffset = subtract(
		{
			x: spriteSizePixels.x * 2,
			y: spriteSizePixels.y,
		},
		charBlockSize
	);
	for (const character of [pl1, pl2, ...level.monsters]) {
		const spritePos = subtract(character.spawnPoint, spritePosOffset);
		const pixelPos = scale(add(spritePos, fakeSpriteCharblockOffset), 1 / 8);
		const pixelIndex = Math.floor(pixelPos.y) * 32 + Math.floor(pixelPos.x);
		const spriteColor =
			rgbPalette[
				character.characterName === "player"
					? character.facingLeft
						? 3 // Cyan
						: 5 // Dark green
					: spriteColors[character.characterName]
			];

		// Monsters are 2x2 chars large.
		for (const offset of [0, 1, 32, 33]) {
			ImageDataFunctions.plotPixel(image, pixelIndex + offset, spriteColor);
		}
	}

	return image;
}

function getAverageCharColor(char: Char, charPalette: SubPalette): Color {
	return mixColors(
		char
			.flatMap((pixels) => pixels)
			.map((pixel) => charPalette[pixel])
			.filter(isDefined)
			.map((paletteIndex) => rgbPalette[paletteIndex])
	);
}
