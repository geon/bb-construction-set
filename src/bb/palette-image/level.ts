import { spritePosOffset } from "../../c64/consts";
import { origo, subtract } from "../../math/coord2";
import { grid } from "../../math/rect";
import { checkedAccess, mapRecord, range } from "../functions";
import { pl1, pl2, spriteLeftIndex } from "../game-definitions/character-name";
import { getDesignatedPowerupItemIndex } from "../game-definitions/items";
import {
	levelHeight,
	levelSize,
	levelWidth,
} from "../game-definitions/level-size";
import { CharGroup } from "../internal-data-formats/char-group";
import { ItemGroups } from "../internal-data-formats/item-groups";
import { ItemSpawnPositions } from "../internal-data-formats/item-spawn-positions";
import {
	Level,
	makeCharset,
	levelToCharNames,
	Tiles,
} from "../internal-data-formats/level";
import { SpriteGroups } from "../internal-data-formats/sprite";
import {
	ItemCategoryName,
	validItemCategoryNames,
} from "../prg/data-locations";
import { ShadowChars } from "../prg/shadow-chars";
import { assertTuple } from "../tuple";
import {
	getLevelCharPalette,
	drawChar,
	drawCharBlock,
	getCharPalette,
} from "./char";
import {
	PaletteImage,
	drawGrid,
	blitPaletteImage,
	drawLayout,
	parseLayout,
} from "./palette-image";
import { drawSprite, getSpritePalette } from "./sprite";

export function drawLevel(
	levelIndex: number,
	level: Level,
	spriteGroups: SpriteGroups,
	shadowChars: ShadowChars,
	itemGroups: ItemGroups,
	charBlocks: CharGroup<2, 2>,
	itemSpawnPositions: ItemSpawnPositions
): PaletteImage {
	// Draw level.
	const charPalette = getLevelCharPalette(level.bgColors);
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

	function drawItem(itemCategoryName: ItemCategoryName): void {
		const spawnPosition = checkedAccess(itemSpawnPositions, levelIndex)[
			itemCategoryName
		];
		const item = checkedAccess(
			itemGroups[itemCategoryName],
			itemCategoryName === "powerups"
				? getDesignatedPowerupItemIndex(levelIndex)
				: levelIndex % 47
		);
		blitPaletteImage(
			image,
			drawCharBlock(
				checkedAccess(charBlocks, item.charBlockIndex),
				getCharPalette(item.paletteIndex, level.bgColors)
			),
			{
				x: spawnPosition.x * 4,
				y: spawnPosition.y * 8,
			}
		);
	}

	// No normal items on the boss level.
	if (levelIndex !== 99) {
		validItemCategoryNames.forEach(drawItem);
	}

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

export function parseLevelTiles(image: PaletteImage): Tiles {
	const solidColor = 1;

	return assertTuple(
		image.map((row) =>
			assertTuple(
				row.map((color) => color === solidColor),
				levelWidth
			)
		),
		levelHeight
	);
}

export function drawLevelsTiles(levelsTiles: readonly Tiles[]): PaletteImage {
	const layout = layOutLevelThumbnails();

	return drawLayout(layout, levelsTiles.map(drawLevelTiles));
}

export function parseLevelsTiles(image: PaletteImage): Tiles[] {
	const layout = layOutLevelThumbnails();

	return parseLayout(layout, image).map(parseLevelTiles);
}
