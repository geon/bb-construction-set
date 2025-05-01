import {
	Level,
	levelToCharNames,
	makeCharset,
} from "../internal-data-formats/level";
import { levelHeight, levelWidth } from "../game-definitions/level-size";
import {
	palette,
	PaletteIndex,
	SubPalette,
} from "../internal-data-formats/palette";
import { Color, mixColors } from "../../math/color";
import { Char } from "../internal-data-formats/char";
import {
	spritePosOffset,
	spriteSize,
	spriteSizePixels,
} from "../../c64/consts";
import { Sprite, SpriteGroups } from "../internal-data-formats/sprite";
import {
	CharacterName,
	pl1,
	pl2,
	spriteLeftIndex,
} from "../game-definitions/character-name";
import { chunk, mapRecord, range, zipObject } from "../functions";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { flexbox, leafs, LayoutRect } from "../../math/rect";
import { spriteCounts } from "../prg/data-locations";
import { add, origo, scale, subtract } from "../../math/coord2";
import { ShadowStyle } from "../prg/shadow-chars";
import { drawChar, getCharPalette } from "./char";
import * as ImageDataFunctions from "./image-data";
import { blitPaletteImage, drawGrid, PaletteImage } from "./palette-image";

export function drawLevelsToCanvas(
	levels: readonly Level[],
	spriteColors: Record<CharacterName, PaletteIndex>,
	shadowStyle: ShadowStyle
): ImageData {
	const gap = { x: 10, y: 10 };

	return ImageDataFunctions.drawGrid(
		levels.map((level) => drawLevelThumbnail(level, spriteColors, shadowStyle)),
		10,
		{
			x: levelWidth,
			y: levelHeight,
		},
		gap
	);
}

function drawLevelThumbnail(
	level: Level,
	spriteColors: Record<CharacterName, PaletteIndex>,
	shadowStyle: ShadowStyle
): ImageData {
	const image = new ImageData(levelWidth, levelHeight);

	// Draw level.
	const charPalette = getCharPalette(level);
	const charset = makeCharset(level, shadowStyle);
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
	const fakeSpriteCharblockOffset = subtract(spriteSize, charBlockSize);
	for (const character of [pl1, pl2, ...level.monsters]) {
		const spritePos = subtract(character.spawnPoint, spritePosOffset);
		const pixelPos = scale(add(spritePos, fakeSpriteCharblockOffset), 1 / 8);
		const pixelIndex = Math.floor(pixelPos.y) * 32 + Math.floor(pixelPos.x);
		const spriteColor =
			palette[
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
			.map((paletteIndex) => palette[paletteIndex])
	);
}

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

export function layOutSpriteGroups(): LayoutRect {
	let index = 0;
	const spriteRects = mapRecord(
		spriteCounts,
		(count): ReadonlyArray<LayoutRect> =>
			range(0, count).map(
				(): LayoutRect => ({
					pos: origo,
					size: { x: spriteSize.x / 2, y: spriteSize.y },
					index: index++,
				})
			)
	);

	const spriteGroupRects = mapRecord(spriteRects, (rects, groupName) => {
		const multiWidth = spriteGroupMultiWidths[groupName];
		const gap = multiWidth === 1 ? { x: 4, y: 8 } : origo;
		return flexbox(
			chunk(rects, multiWidth === 1 ? 4 : multiWidth).map((row) =>
				flexbox(row, "row", gap.x)
			),
			"column",
			gap.y
		);
	});

	return flexbox(
		[
			[
				spriteGroupRects.player,
				spriteGroupRects.bubbleBuster,
				spriteGroupRects.stoner,
				spriteGroupRects.beluga,
			],
			[
				spriteGroupRects.hullaballoon,
				spriteGroupRects.colley,
				spriteGroupRects.incendo,
				spriteGroupRects.willyWhistle,
				spriteGroupRects.superSocket,
			],
			[
				flexbox(
					[spriteGroupRects.playerInBubbleA, spriteGroupRects.playerInBubbleB],
					"row",
					8
				),
				spriteGroupRects.bossFacingLeft,
				spriteGroupRects.bossFacingRight,
				spriteGroupRects.bossInBubble,
				flexbox(
					[spriteGroupRects.bonusCupCake, spriteGroupRects.bonusMelon],
					"row",
					8
				),
				spriteGroupRects.bonusDiamond,
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		3 * 4
	);
}

export function drawSpritesToCanvas(spriteGroups: SpriteGroups): PaletteImage {
	const sprites = Object.values(
		mapRecord(spriteGroups, (spriteGroup) => {
			return spriteGroup.sprites.map((sprite) =>
				drawSprite(sprite, getSpritePalette(spriteGroup.color))
			);
		})
	).flat();

	const layout = layOutSpriteGroups();
	const spritePositions = leafs(layout).map(({ pos }) => pos);

	const image: PaletteImage = {
		width: layout.size.x,
		height: layout.size.y,
		data: [],
	};
	for (const { sprite, pos } of zipObject({
		sprite: sprites,
		pos: spritePositions,
	})) {
		blitPaletteImage(image, sprite, pos.x, pos.y);
	}

	return image;
}

function drawSprite(sprite: Sprite, spritePalette: SubPalette): PaletteImage {
	return {
		width: spriteSizePixels.x,
		height: spriteSizePixels.y,
		data: sprite
			.flat()
			.map((pixelValue) =>
				pixelValue ? spritePalette[pixelValue] : undefined
			),
	};
}

function getSpritePalette(color: PaletteIndex): SubPalette {
	return [
		0, // Transparent (Black)
		2, // Dark red
		color,
		1, // White
	];
}

const spriteGroupMultiWidths: Record<SpriteGroupName, number> = {
	player: 1,
	bubbleBuster: 1,
	incendo: 1,
	colley: 1,
	hullaballoon: 1,
	beluga: 1,
	willyWhistle: 1,
	stoner: 1,
	superSocket: 1,
	playerInBubbleA: 2,
	playerInBubbleB: 2,
	bossFacingLeft: 3,
	bossInBubble: 3,
	bossFacingRight: 3,
	bonusCupCake: 2,
	bonusMelon: 2,
	bonusDiamond: 2,
};
