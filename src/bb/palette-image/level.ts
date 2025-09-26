import { spritePosOffset } from "../../c64/consts";
import { origo, subtract } from "../../math/coord2";
import { grid } from "../../math/rect";
import { mapRecord, range } from "../functions";
import { pl1, pl2, spriteLeftIndex } from "../game-definitions/character-name";
import { levelHeight, levelWidth } from "../game-definitions/level-size";
import {
	Level,
	makeCharset,
	levelToCharNames,
	Tiles,
} from "../internal-data-formats/level";
import { SpriteGroups } from "../internal-data-formats/sprite";
import { ShadowChars } from "../prg/shadow-chars";
import { getLevelCharPalette, drawChar } from "./char";
import {
	PaletteImage,
	drawGrid,
	blitPaletteImage,
	drawLayout,
} from "./palette-image";
import { drawSprite, getSpritePalette } from "./sprite";

export function drawLevel(
	level: Level,
	spriteGroups: SpriteGroups,
	shadowChars: ShadowChars
): PaletteImage {
	// Draw level.
	const charPalette = getLevelCharPalette(level);
	const charset = mapRecord(makeCharset(level, shadowChars), (char) =>
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

		blitPaletteImage(image, drawSprite(sprite, getSpritePalette(spriteColor)), {
			x: spritePos.x / 2,
			y: spritePos.y,
		});
	}

	return image;
}

export function layOutLevelThumbnails() {
	const levelSize = {
		x: levelWidth,
		y: levelHeight,
	};
	const gap = { x: 10, y: 10 };

	return grid(
		range(100).map((index) => ({
			index,
			size: levelSize,
			pos: origo,
		})),
		10,
		gap
	);
}

export function drawLevelTiles(tiles: Tiles): PaletteImage {
	const solidColor = 1;
	const emptyColor = 0;

	return tiles.map((row) =>
		row.map((solid) => (solid ? solidColor : emptyColor))
	);
}

export function drawLevelsTiles(levels: readonly Level[]): PaletteImage {
	const layout = layOutLevelThumbnails();

	return drawLayout(
		layout,
		levels.map((level) => drawLevelTiles(level.tiles))
	);
}
