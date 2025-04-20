import {
	Level,
	levelToCharNames,
	makeCharset,
} from "../internal-data-formats/level";
import { levelHeight, levelWidth } from "../game-definitions/level-size";
import { palette, PaletteIndex } from "../internal-data-formats/palette";
import { Color, mixColors } from "../../math/color";
import { CharsetChar } from "../internal-data-formats/charset-char";
import {
	spriteHeight,
	spritePosOffset,
	spriteSize,
	spriteWidthBytes,
} from "../../c64/consts";
import { Sprite, SpriteGroups } from "../internal-data-formats/sprite";
import {
	CharacterName,
	pl1,
	pl2,
	spriteLeftIndex,
} from "../game-definitions/character-name";
import { Item } from "../prg/items";
import { chunk, mapRecord, range, zipObject } from "../functions";
import { ReadonlyTuple } from "../tuple";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { flexbox, leafs, LayoutRect } from "../../math/rect";
import { spriteCounts } from "../prg/data-locations";
import { add, origo, scale, subtract } from "../../math/coord2";
import { ShadowStyle } from "../prg/shadow-chars";
import {
	blitImageData,
	blitImageDataMasked,
	drawGrid,
	plotPixel,
} from "./image-data";
import { drawChar } from "./char";

export function drawLevelsToCanvas(
	levels: readonly Level[],
	spriteColors: Record<CharacterName, PaletteIndex>
): ImageData {
	const gap = 10;

	return drawGrid(
		levels.map((level) => drawLevelThumbnail(level, spriteColors)),
		10,
		gap
	);
}

function drawLevelThumbnail(
	level: Level,
	spriteColors: Record<CharacterName, PaletteIndex>
): ImageData {
	const image = new ImageData(levelWidth, levelHeight);

	// Draw level.
	const charPalette = getCharPalette(level);
	const charset = makeCharset(level, "originalC64");
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
			plotPixel(image, pixelIndex, color);
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
			plotPixel(image, pixelIndex + offset, spriteColor);
		}
	}

	return image;
}

function getAverageCharColor(
	char: CharsetChar,
	charPalette: [Color, Color, Color, Color]
): Color {
	return mixColors(
		char.lines.flatMap((pixels) => pixels).map((pixel) => charPalette[pixel])
	);
}

export function drawLevel(
	level: Level,
	spriteGroups: SpriteGroups,
	shadowStyle: ShadowStyle
): ImageData {
	// Draw level.
	const charPalette = getCharPalette(level);
	const charset = mapRecord(makeCharset(level, shadowStyle), (char) =>
		drawChar(char, charPalette)
	);

	const image = drawGrid(
		levelToCharNames(level)
			.flat()
			.map((charName) => charset[charName]),
		levelWidth
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

		blitImageDataMasked(
			image,
			drawSprite(sprite, getSpritePalette(spriteColor)),
			spritePos.x,
			spritePos.y,
			{ r: 0, g: 0, b: 0 }
		);
	}

	return image;
}

export function drawPlatformCharsToCanvas(levels: readonly Level[]): ImageData {
	const gap = 10;
	return drawGrid(levels.map(drawLevelPlatformChars), 10, gap);
}

function drawLevelPlatformChars(level: Level): ImageData {
	const charPalette = getCharPalette(level);

	const platformChars = [
		[level.platformChar, level.platformChar],
		[level.platformChar, level.platformChar],
	];

	const [ul, ur, bl, br] = level.sidebarChars ?? platformChars.flat();
	const sidebarChars = [
		[ul, bl],
		[ur, br],
	];

	const sidebarImage = drawCharblock(sidebarChars, charPalette);
	const platformImage = drawCharblock(platformChars, charPalette);

	return drawGrid(
		[sidebarImage, platformImage, sidebarImage, platformImage],
		2
	);
}

function getCharPalette(level: Level): [Color, Color, Color, Color] {
	return [
		palette[0],
		palette[level.bgColorDark],
		palette[level.bgColorLight],
		// The color ram gets cleared to green at the beginning of the game.
		palette[5],
	];
}

export function layOutSpriteGroups(): LayoutRect {
	let index = 0;
	const spriteRects = mapRecord(
		spriteCounts,
		(count): ReadonlyArray<LayoutRect> =>
			range(0, count).map(
				(): LayoutRect => ({
					pos: origo,
					size: spriteSize,
					index: index++,
				})
			)
	);

	const spriteGroupRects = mapRecord(spriteRects, (rects, groupName) => {
		const multiWidth = spriteGroupMultiWidths[groupName];
		const gap = multiWidth === 1 ? 8 : 0;
		return flexbox(
			chunk(rects, multiWidth === 1 ? 4 : multiWidth).map((row) =>
				flexbox(row, "row", gap)
			),
			"column",
			gap
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
		3 * 8
	);
}

export function drawSpritesToCanvas(spriteGroups: SpriteGroups): ImageData {
	const sprites = Object.values(
		mapRecord(spriteGroups, (spriteGroup) => {
			return spriteGroup.sprites.map((sprite) =>
				drawSprite(sprite, getSpritePalette(spriteGroup.color))
			);
		})
	).flat();

	const layout = layOutSpriteGroups();
	const spritePositions = leafs(layout).map(({ pos }) => pos);

	const image = new ImageData(layout.size.x, layout.size.y);
	for (const { sprite, pos } of zipObject({
		sprite: sprites,
		pos: spritePositions,
	})) {
		blitImageData(image, sprite, pos.x, pos.y);
	}

	return image;
}

function drawSprite(
	sprite: Sprite,
	spritePalette: [Color, Color, Color, Color]
): ImageData {
	const image = new ImageData(spriteWidthBytes * 8, spriteHeight);

	for (let pixelY = 0; pixelY < spriteHeight; ++pixelY) {
		for (let byteX = 0; byteX < spriteWidthBytes; ++byteX) {
			const byte = sprite.bitmap[pixelY * spriteWidthBytes + byteX]!;
			for (let pixelX = 0; pixelX < 4; ++pixelX) {
				const color = spritePalette[(byte >> ((3 - pixelX) * 2)) & 0b11]!;

				// Double width pixels.
				const pixelIndex =
					pixelY * spriteWidthBytes * 8 + byteX * 8 + pixelX * 2;
				plotPixel(image, pixelIndex, color);
				plotPixel(image, pixelIndex + 1, color);
			}
		}
	}
	return image;
}

function getSpritePalette(color: PaletteIndex): [Color, Color, Color, Color] {
	return [
		palette[0], // Transparent (Black)
		palette[2], // Dark red
		palette[color],
		palette[1], // White
	];
}

type CharPalette = ReadonlyTuple<Color, 4>;
function drawCharblock(
	item: Item<number, number>,
	charPalette: CharPalette,
	mask?: Item<number, number>
): ImageData {
	// The chars are column-order just like in the game.
	const image = new ImageData(item.length * 8, item[0]!.length * 8);

	for (const [charBlockX, column] of item.entries()) {
		for (const [charBlockY, char] of column.entries()) {
			blitImageData(
				image,
				drawChar(char, charPalette, mask?.[charBlockX]?.[charBlockY]),
				charBlockX * 8,
				charBlockY * 8
			);
		}
	}

	return image;
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
