import { spritePosOffset } from "../../c64/consts";
import { origo, subtract } from "../../math/coord2";
import { grid } from "../../math/rect";
import {
	checkedAccess,
	chunk,
	mapRecord,
	range,
	repeat,
	stringPadLeft,
} from "../functions";
import { pl1, pl2, spriteLeftIndex } from "../game-definitions/character-name";
import { getDesignatedPowerupItemIndex } from "../game-definitions/items";
import {
	levelHeight,
	levelSize,
	levelWidth,
} from "../game-definitions/level-size";
import { Char } from "../internal-data-formats/char";
import { CharGroup } from "../internal-data-formats/char-group";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import {
	makeCharset,
	levelToCharNames,
	Tiles,
} from "../internal-data-formats/level";
import { palette } from "../internal-data-formats/palette";
import { ParsedPrg } from "../internal-data-formats/parsed-prg";
import {
	ItemCategoryName,
	validItemCategoryNames,
} from "../prg/data-locations";
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
	cropPaletteImage,
} from "./palette-image";
import { drawSprite, getSpritePalette } from "./sprite";

export function drawLevel(
	levelIndex: number,
	parsedPrg: ParsedPrg
): PaletteImage {
	const level = parsedPrg.levels[levelIndex]!;

	// Draw level.
	const charPalette = getLevelCharPalette(level.bgColors);
	const charset = mapRecord(
		makeCharset(level, assertTuple(parsedPrg.chars.shadows.flat().flat(), 6)),
		(char) => drawChar(char, charPalette)
	);

	const image = drawGrid(
		levelToCharNames(level)
			.flat()
			.map((charName) => charset[charName]),
		levelWidth,
		{ x: 4, y: 8 }
	);

	function drawLevelNumber(levelIndex: number): void {
		const digitHeight = 5;
		const digitCharImages = chunk(
			parsedPrg.chars.fontLevelNumbers5px.flat(3),
			digitHeight
		)
			.slice(0, 10)
			.map((char6px) => {
				const char: Char = assertTuple(
					[...char6px, ...repeat(parseColorPixelByte(0), 8 - digitHeight)],
					8
				);
				return cropPaletteImage(
					drawChar(char, getCharPalette(palette.white, level.bgColors)),
					{
						pos: origo,
						size: { x: 4, y: digitHeight + 1 },
					}
				);
			});

		const levelDigits = stringPadLeft((levelIndex + 1).toString(), 2, "0")
			.split("")
			.map((x) => parseInt(x));
		[...levelDigits.entries()].reverse().forEach(([index, digit]) =>
			blitPaletteImage(image, digitCharImages[digit]!, {
				x: levelIndex === 99 ? index * 3 - 1 : 4 * index,
				y: 0,
			})
		);
	}
	drawLevelNumber(levelIndex);

	function drawItem(itemCategoryName: ItemCategoryName): void {
		const spawnPosition = level.itemSpawnPositions[itemCategoryName];
		const item = checkedAccess(
			parsedPrg.items[itemCategoryName],
			itemCategoryName === "powerups"
				? getDesignatedPowerupItemIndex(levelIndex)
				: levelIndex % 47
		);
		blitPaletteImage(
			image,
			drawCharBlock(
				checkedAccess(
					parsedPrg.chars.items as CharGroup<2, 2>,
					item.charBlockIndex
				),
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
			parsedPrg.sprites[character.characterName].sprites[
				character.facingLeft ? spriteLeftIndex[character.characterName] : 0
			]!;
		const spritePos = subtract(character.spawnPoint, spritePosOffset);
		const spriteColor =
			character.characterName === "player"
				? character.facingLeft
					? palette.cyan
					: palette.green
				: parsedPrg.sprites[character.characterName].color;

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
