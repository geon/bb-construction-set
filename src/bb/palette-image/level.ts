import { spritePosOffset } from "../../c64/consts";
import { subtract } from "../../math/coord2";
import { mapRecord } from "../functions";
import { pl1, pl2, spriteLeftIndex } from "../game-definitions/character-name";
import { levelWidth } from "../game-definitions/level-size";
import {
	Level,
	makeCharset,
	levelToCharNames,
} from "../internal-data-formats/level";
import { SpriteGroups } from "../internal-data-formats/sprite";
import { ShadowStyle } from "../prg/shadow-chars";
import { getCharPalette, drawChar } from "./char";
import { PaletteImage, drawGrid, blitPaletteImage } from "./palette-image";
import { drawSprite, getSpritePalette } from "./sprite";

export function drawLevel(
	level: Level,
	spriteGroups: SpriteGroups,
	shadowStyle: ShadowStyle
): PaletteImage {
	// Draw level.
	const charPalette = getCharPalette(level);
	const charset = mapRecord(makeCharset(level, shadowStyle), (char) =>
		drawChar(char, charPalette)
	);

	const image = drawGrid(
		levelToCharNames(level)
			.flat()
			.map((charName) => charset[charName]),
		levelWidth,
		{ x: 4, y: 8 }
	);

	for (const character of [pl1, pl2, ...level.monsters]) {
		const sprite =
			spriteGroups[character.characterName].sprites[
				character.facingLeft ? spriteLeftIndex[character.characterName] : 0
			]!;
		const spritePos = subtract(character.spawnPoint, spritePosOffset);
		const spriteColor =
			character.characterName === "player"
				? character.facingLeft
					? 3 // Cyan
					: 5 // Dark green
				: spriteGroups[character.characterName].color;

		blitPaletteImage(
			image,
			drawSprite(sprite, getSpritePalette(spriteColor)),
			spritePos.x / 2,
			spritePos.y
		);
	}

	return image;
}
