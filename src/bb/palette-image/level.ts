import { spritePosOffset } from "../../c64/consts";
import { Coord2, multiply, origo, subtract } from "../../math/coord2";
import { grid, rectIntersection } from "../../math/rect";
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
import { BgColors } from "../internal-data-formats/bg-colors";
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
import { assertTuple, Tuple } from "../tuple";
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
	drawRect,
} from "./palette-image";
import { drawSprite, getSpritePalette } from "./sprite";

export type LevelEditorOptions =
	| {
			readonly type: "move-enemies";
			readonly selectedMonsterIndex: number | undefined;
			readonly dragging: boolean;
	  }
	| {
			readonly type: "wind-editor";
			readonly selectedRectangleIndex?: number;
			readonly dust: readonly Coord2[];
	  };

export function drawLevel(
	levelIndex: number,
	parsedPrg: ParsedPrg,
	options: LevelEditorOptions | undefined
): PaletteImage {
	const level = parsedPrg.levels[levelIndex]!;

	const mutedBgColors: BgColors = {
		light: palette.white,
		dark: palette.lightGrey,
	};
	const bgColors =
		options?.type === "wind-editor" ? mutedBgColors : level.bgColors;

	// Draw level.
	const charPalette = getLevelCharPalette(bgColors);
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
					drawChar(char, getCharPalette(palette.white, bgColors)),
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
				getCharPalette(item.paletteIndex, bgColors)
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

	for (const [index, character] of [
		...[...level.monsters, pl1, pl2].entries(),
	]) {
		const dragging =
			options?.type === "move-enemies" &&
			index === options.selectedMonsterIndex &&
			options.dragging;

		const sprite =
			parsedPrg.sprites[character.characterName].sprites[
				dragging
					? parsedPrg.sprites[character.characterName].sprites.length - 1
					: character.facingLeft
					? spriteLeftIndex[character.characterName]
					: 0
			]!;
		const spritePos = subtract(character.spawnPoint, spritePosOffset);
		const spriteColor =
			options?.type === "move-enemies" &&
			index === options.selectedMonsterIndex &&
			!options.dragging
				? palette.lightRed
				: character.characterName === "player"
				? character.facingLeft
					? palette.cyan
					: palette.green
				: parsedPrg.sprites[character.characterName].color;

		blitPaletteImage(image, drawSprite(sprite, getSpritePalette(spriteColor)), {
			x: spritePos.x / 2,
			y: spritePos.y,
		});
	}

	if (options?.type === "wind-editor") {
		if (level.bubbleCurrentRectangles.type == "rectangles") {
			for (const [index, rectangle] of [
				...level.bubbleCurrentRectangles.rectangles.entries(),
			]) {
				if (rectangle?.type === "rectangle") {
					const clippedRectangle = rectIntersection(rectangle.rect, {
						pos: origo,
						size: levelSize,
					});
					if (
						clippedRectangle &&
						clippedRectangle.size.x &&
						clippedRectangle.size.y
					) {
						const scaledRectangle = mapRecord(clippedRectangle, (coord) =>
							multiply(coord, { x: 4, y: 8 })
						);
						const rectColors =
							options.selectedRectangleIndex === index
								? ([palette.lightGreen, palette.green] as const)
								: ([palette.blue, palette.purple] as const);
						drawRect(image, scaledRectangle, rectColors);
					}
				}
			}
		}

		options.dust.forEach(
			(pos) => (image[pos.y]![Math.floor(pos.x / 2)] = palette.darkGrey)
		);
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

export function drawLevelsTiles(levelsTiles: Tuple<Tiles, 100>): PaletteImage {
	const layout = layOutLevelThumbnails();

	return drawLayout(layout, levelsTiles.map(drawLevelTiles));
}

export function parseLevelsTiles(image: PaletteImage): Tuple<Tiles, 100> {
	const layout = layOutLevelThumbnails();

	return assertTuple(parseLayout(layout, image).map(parseLevelTiles), 100);
}
