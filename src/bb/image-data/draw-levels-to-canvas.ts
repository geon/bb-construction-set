import {
	Level,
	levelHeight,
	levelWidth,
	numTiles,
	Tiles,
} from "../internal-data-formats/level";
import { palette, PaletteIndex } from "../internal-data-formats/palette";
import { Color, mixColors, black } from "../../math/color";
import { CharsetChar } from "../internal-data-formats/charset-char";
import { spriteHeight, spriteWidthBytes } from "../../c64/consts";
import { Sprite, SpriteGroups } from "../internal-data-formats/sprite";
import { CharacterName } from "../game-definitions/character-name";
import { Item, ItemGroup, ItemGroups } from "../prg/items";
import { chunk, mapRecord, range, sum, zipObject } from "../functions";
import { assertTuple, ReadonlyTuple } from "../tuple";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { flexbox, leafs, LayoutRect } from "../../math/rect";
import { spriteCounts } from "../prg/data-locations";
import { origo } from "../../math/coord2";

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

	// Fill with background color.
	const bgColor = palette[0];
	for (let tileY = 0; tileY < levelHeight; ++tileY) {
		for (let tileX = 0; tileX < levelWidth; ++tileX) {
			const tileIndex = tileY * levelWidth + tileX;
			image.data[tileIndex * 4 + 0] = bgColor.r;
			image.data[tileIndex * 4 + 1] = bgColor.g;
			image.data[tileIndex * 4 + 2] = bgColor.b;
			image.data[tileIndex * 4 + 3] = 255;
		}
	}

	// Draw shadows.
	const shadowColor = palette[level.bgColorDark];
	// The shadows use only the dark background color, and black.
	drawTiles(image, level.tiles, mixColors([shadowColor, black, black]), 1);
	drawTiles(
		image,
		level.tiles,
		mixColors([shadowColor, black, black]),
		levelWidth
	);
	drawTiles(
		image,
		level.tiles,
		mixColors([shadowColor, black]),
		levelWidth + 1
	);

	// Draw level.
	const charPalette = getCharPalette(level);
	drawTiles(
		image,
		level.tiles,
		// The platforms use only the 3 background colors.
		mixColors(
			level.platformChar.lines
				.flatMap((pixels) => pixels)
				.map((pixel) => charPalette[pixel])
		),
		0
	);

	for (const monster of level.monsters) {
		const pixelIndex =
			Math.floor((monster.spawnPoint.y - 41) / 8) * 32 +
			Math.floor((monster.spawnPoint.x - 20) / 8);

		// Monsters are 2x2 chars large.
		for (const offset of [0, 1, 32, 33]) {
			plotPixel(
				image,
				pixelIndex + offset,
				palette[Object.values(spriteColors)[monster.type + 1]!]
			);
		}
	}

	return image;
}

function drawTiles(
	image: ImageData,
	tiles: Tiles,
	color: Color,
	offset: number
) {
	for (const [tileY, row] of tiles.entries()) {
		for (const [tileX, tileIsSet] of row.entries()) {
			const tileIndex = tileY * levelWidth + tileX;
			const pixelIndex = tileIndex + offset;
			if (tileIsSet && pixelIndex < numTiles) {
				plotPixel(image, pixelIndex, color);
			}
		}
	}
}

function plotPixel(
	image: ImageData,
	pixelIndex: number,
	color: Color,
	alpha: number = 255
) {
	image.data[pixelIndex * 4 + 0] = color.r;
	image.data[pixelIndex * 4 + 1] = color.g;
	image.data[pixelIndex * 4 + 2] = color.b;
	image.data[pixelIndex * 4 + 3] = alpha;
}

export function drawPlatformCharsToCanvas(levels: readonly Level[]): ImageData {
	const gap = 10;
	return imageDataConcatenate(
		chunk(levels, 10).map((row) =>
			imageDataConcatenate(row.map(drawLevelPlatformChars), "row", gap)
		),
		"column",
		gap
	);
}

function drawGrid(
	images: readonly ImageData[],
	rowWidth: number,
	gap: number = 0
): ImageData {
	return imageDataConcatenate(
		chunk(images, rowWidth).map((row) => imageDataConcatenate(row, "row", gap)),
		"column",
		gap
	);
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

function drawChar(
	char: CharsetChar,
	charPalette: readonly [Color, Color, Color, Color],
	mask?: CharsetChar
) {
	const image = new ImageData(8, 8);

	for (const [charY, line] of char.lines.entries()) {
		for (const [charX, colorIndex] of line.entries()) {
			const masked = mask?.lines?.[charY]?.[charX];
			if (masked !== undefined && !(masked === 0b11 || masked === 0b00)) {
				throw new Error("Invalid mask pixel");
			}
			const alpha = masked ? 0 : 255;

			const color = charPalette[colorIndex];
			// Double width pixels.
			const pixelIndex = charY * 8 + charX * 2;
			plotPixel(image, pixelIndex, color, alpha);
			plotPixel(image, pixelIndex + 1, color, alpha);
		}
	}
	return image;
}

export function layOutSpriteGroups(): LayoutRect {
	const spriteSize = {
		x: spriteWidthBytes * 8,
		y: spriteHeight,
	};

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

export function drawItemsToCanvas(itemGroups: ItemGroups): ImageData {
	const sharedBubbleMask = assertTuple(
		itemGroups.bubbleBlow.masks?.slice(8) ?? [],
		4
	);

	const itemImageGroups = mapRecord(
		mapRecord(itemGroups, (itemGroup, groupName): ItemGroup<number, number> => {
			const masks = (() => {
				switch (groupName) {
					case "specialBubbles":
						return range(0, 3).flatMap(() => sharedBubbleMask);
					case "extendBubbles":
						return range(0, 5).flatMap(() => sharedBubbleMask);
					case "stonerWeapon":
						return [sharedBubbleMask[0], sharedBubbleMask[2]];
					default:
						return undefined;
				}
			})();

			return masks
				? {
						items: itemGroup.items,
						masks,
				  }
				: itemGroup;
		}),
		(itemGroup) => {
			const maskedItems = zipObject(itemGroup).map(
				({ items: charblock, masks: mask }) => ({ charblock, mask })
			);

			return maskedItems.map((maskedItem) =>
				drawCharblock(
					maskedItem.charblock,
					[
						palette[0], //black
						palette[9], // Brown
						palette[1], // White
						palette[5], // Green
					],
					maskedItem.mask
				)
			);
		}
	);

	const renderedItemGroups = mapRecord(
		itemImageGroups,
		(itemImages, groupName) =>
			drawGrid(
				itemImages,
				{
					bubbleBlow: 4,
					bubblePop: 4,
					specialBubbles: 4,
					extendBubbles: 4,
					items: Math.ceil(Math.sqrt(itemImageGroups.items.length)),
				}[groupName as string] ?? 1000,
				8
			)
	);

	return imageDataConcatenate(
		[
			[
				renderedItemGroups.bubbleBlow,
				renderedItemGroups.specialBubbles,
				renderedItemGroups.extendBubbles,
			],
			[
				renderedItemGroups.bubblePop,
				renderedItemGroups.fire,
				renderedItemGroups.baronVonBlubba,
				renderedItemGroups.stonerWeapon,
				renderedItemGroups.drunkAndInvaderWeapon,
				imageDataConcatenate(
					[renderedItemGroups.incendoWeapon, renderedItemGroups.lightning],
					"row",
					8
				),
			],
			[
				renderedItemGroups.items,
				renderedItemGroups.bonusRoundCircles,
				renderedItemGroups.largeLightning,
			],
		].map((chunk) => imageDataConcatenate(chunk, "column", 3 * 8)),
		"row",
		4 * 8
	);
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

// Just like ctx.putImageData
function blitImageData(to: ImageData, from: ImageData, dx: number, dy: number) {
	for (let y = 0; y < from.height; ++y) {
		for (let x = 0; x < from.width; ++x) {
			for (let channel = 0; channel < 4; ++channel) {
				to.data[((y + dy) * to.width + (x + dx)) * 4 + channel] =
					from.data[(y * from.width + x) * 4 + channel]!;
			}
		}
	}
}

function imageDataConcatenate(
	images: ReadonlyArray<ImageData>,
	direction: "row" | "column",
	gap: number
): ImageData {
	const directionSizeSelector = (x: ImageData) =>
		x[({ row: "width", column: "height" } as const)[direction]];
	const orthogonalSizeSelector = (x: ImageData) =>
		x[({ row: "height", column: "width" } as const)[direction]];

	const sumGap = gap * (images.length - 1);

	const totalDirectionSize = sum(images.map(directionSizeSelector)) + sumGap;
	const maxOrthogonalSize = Math.max(...images.map(orthogonalSizeSelector));

	const result = new ImageData(
		...(
			{
				row: [totalDirectionSize, maxOrthogonalSize],
				column: [maxOrthogonalSize, totalDirectionSize],
			} as const
		)[direction]
	);

	let offset = 0;
	for (const image of images) {
		blitImageData(
			result,
			image,
			direction === "row" ? offset : 0,
			direction === "column" ? offset : 0
		);
		offset += directionSizeSelector(image) + gap;
	}

	return result;
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
