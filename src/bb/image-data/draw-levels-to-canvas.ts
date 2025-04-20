import {
	Character,
	Level,
	levelToCharNames,
	makeCharset,
	Tiles,
} from "../internal-data-formats/level";
import { levelHeight, levelWidth } from "../game-definitions/level-size";
import { palette, PaletteIndex } from "../internal-data-formats/palette";
import { Color, mixColors, black } from "../../math/color";
import { CharsetChar } from "../internal-data-formats/charset-char";
import { spriteHeight, spriteWidthBytes } from "../../c64/consts";
import { Sprite, SpriteGroups } from "../internal-data-formats/sprite";
import {
	CharacterName,
	spriteLeftIndex,
} from "../game-definitions/character-name";
import { Item, ItemGroup, itemGroupMeta, ItemGroups } from "../prg/items";
import { chunk, mapRecord, range, unzipObject, zipObject } from "../functions";
import { assertTuple, ReadonlyTuple } from "../tuple";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import {
	flexbox,
	leafs,
	LayoutRect,
	grid,
	boundingBox,
	flexboxChildPositions,
} from "../../math/rect";
import { spriteCounts } from "../prg/data-locations";
import { Coord2, origo, scale, subtract } from "../../math/coord2";

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
	fillImageData(image, bgColor);

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
		const spritePosOffset = {
			x: 20,
			y: 41,
		};
		const spritePos = subtract(monster.spawnPoint, spritePosOffset);
		const pixelPos = scale(spritePos, 1 / 8);
		const pixelIndex = Math.floor(pixelPos.y) * 32 + Math.floor(pixelPos.x);

		// Monsters are 2x2 chars large.
		for (const offset of [0, 1, 32, 33]) {
			plotPixel(
				image,
				pixelIndex + offset,
				palette[spriteColors[monster.characterName]]
			);
		}
	}

	return image;
}

export function drawLevel(level: Level, spriteGroups: SpriteGroups): ImageData {
	// Draw level.
	const charPalette = getCharPalette(level);
	const charset = mapRecord(makeCharset(level, "retroForge"), (char) =>
		drawChar(char, charPalette)
	);

	const image = drawGrid(
		levelToCharNames(level)
			.flat()
			.map((charName) => charset[charName]),
		levelWidth
	);

	const characters: ReadonlyArray<Character> = [
		{
			spawnPoint: {
				x: 44, // The tail is 6 pixels from the edge.
				y: 221,
			},
			characterName: "player",
			facingLeft: false,
		},
		{
			spawnPoint: {
				x: 236, // Only 4 pixels from the edge. Not same as pl1.
				y: 221,
			},
			characterName: "player",
			facingLeft: true,
		},
		...level.monsters,
	];

	for (const character of characters) {
		const sprite =
			spriteGroups[character.characterName].sprites[
				character.facingLeft ? spriteLeftIndex[character.characterName] : 0
			]!;
		const spritePosOffset = {
			x: 24,
			y: 50,
		};
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

function fillImageData(image: ImageData, bgColor: Color) {
	for (let pixelIndex = 0; pixelIndex < image.data.length / 4; ++pixelIndex) {
		image.data[pixelIndex * 4 + 0] = bgColor.r;
		image.data[pixelIndex * 4 + 1] = bgColor.g;
		image.data[pixelIndex * 4 + 2] = bgColor.b;
		image.data[pixelIndex * 4 + 3] = 255;
	}
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
			if (tileIsSet && pixelIndex < levelWidth * levelHeight) {
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
	return drawGrid(levels.map(drawLevelPlatformChars), 10, gap);
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

function layoutLargeLightning(index: number) {
	// 4x4 grid, but 2 corners are missing 3 chars each.
	//  *  * [*][*]
	//  * [*][*][*]
	// [*][*][*] *
	// [*][*] *  *
	const positions: ReadonlyArray<Coord2> = [
		{ x: 2, y: 0 },
		{ x: 3, y: 0 },
		{ x: 0, y: 1 },
		{ x: 1, y: 1 },
		{ x: 2, y: 1 },
		{ x: 1, y: 2 },
		{ x: 2, y: 2 },
		{ x: 3, y: 2 },
		{ x: 0, y: 3 },
		{ x: 1, y: 3 },
	];

	const { width, height } = itemGroupMeta.largeLightning;
	if (positions.length !== width * height) {
		throw new Error(
			`Bad char count for largeLightning. Was ${positions.length}, should be ${
				width * height
			}.`
		);
	}

	const children = positions.map(
		(pos): LayoutRect => ({
			pos: scale(pos, 8),
			size: { x: 8, y: 8 },
			index: index++,
		})
	);

	return {
		...boundingBox(children),
		children,
	};
}

export function layOutItemGroups(): LayoutRect {
	let index = 0;
	const itemRectGroups = mapRecord(
		itemGroupMeta,
		(group, groupName): ReadonlyArray<LayoutRect> =>
			range(0, group.count).map(() => {
				if (groupName === "largeLightning") {
					const layout = layoutLargeLightning(index);
					index += layout.children.length;
					return layout;
				}

				return flexbox(
					range(0, group.width).map(
						(): LayoutRect =>
							flexbox(
								range(0, group.height).map(
									(): LayoutRect => ({
										pos: origo,
										size: { x: 8, y: 8 },
										index: index++,
									})
								),
								"column",
								0
							)
					),
					"row",
					0
				);
			})
	);

	const laidOutItemGroups = mapRecord(itemRectGroups, (itemRects, groupName) =>
		grid(
			itemRects,
			{
				bubbleBlow: 4,
				bubblePop: 4,
				specialBubbles: 4,
				extendBubbles: 4,
				items: Math.ceil(Math.sqrt(itemRectGroups.items.length)),
			}[groupName as string] ?? 1000,
			8
		)
	);

	return flexbox(
		[
			[
				laidOutItemGroups.bubbleBlow,
				laidOutItemGroups.specialBubbles,
				laidOutItemGroups.extendBubbles,
			],
			[
				laidOutItemGroups.bubblePop,
				laidOutItemGroups.fire,
				laidOutItemGroups.baronVonBlubba,
				laidOutItemGroups.stonerWeapon,
				laidOutItemGroups.drunkAndInvaderWeapon,
				flexbox(
					[laidOutItemGroups.incendoWeapon, laidOutItemGroups.lightning],
					"row",
					8
				),
			],
			[
				laidOutItemGroups.items,
				laidOutItemGroups.bonusRoundCircles,
				laidOutItemGroups.largeLightning,
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		4 * 8
	);
}

export function drawItemsToCanvas(itemGroups: ItemGroups): ImageData {
	const sharedBubbleMask = assertTuple(
		itemGroups.bubbleBlow.slice(8).map((x) => x.mask!),
		4
	);

	const chars = Object.values(
		mapRecord(
			mapRecord(
				itemGroups,
				(itemGroup, groupName): ItemGroup<number, number> => {
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
						? zipObject({
								item: itemGroup.map(({ item }) => item),
								mask: masks,
						  })
						: itemGroup;
				}
			),
			(maskedItems) => {
				const { item: items, mask: itemMasks } = unzipObject(maskedItems);
				const chars = items.flat().flat();
				const masks = itemMasks?.flat().flat() ?? chars.map(() => undefined);
				const maskedChars = zipObject({
					char: chars,
					mask: masks,
				});

				return maskedChars.map((maskedChar) =>
					drawChar(
						maskedChar.char,
						[
							palette[0], //black
							palette[9], // Brown
							palette[1], // White
							palette[5], // Green
						],
						maskedChar.mask
					)
				);
			}
		)
	).flat();

	const layout = layOutItemGroups();
	const itemPositions = leafs(layout).map(({ pos }) => pos);

	const image = new ImageData(layout.size.x, layout.size.y);
	for (const { char: item, pos } of zipObject({
		char: chars,
		pos: itemPositions,
	})) {
		blitImageData(image, item, pos.x, pos.y);
	}

	return image;
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
		const toStart = ((y + dy) * to.width + dx) * 4;
		const fromStart = y * from.width * 4;
		to.data.set(
			from.data.slice(fromStart, fromStart + from.width * 4),
			toStart
		);
	}
}

function blitImageDataMasked(
	to: ImageData,
	from: ImageData,
	dx: number,
	dy: number,
	maskColor: Color
) {
	for (let y = 0; y < from.height; ++y) {
		for (let x = 0; x < from.width; ++x) {
			for (let channel = 0; channel < 4; ++channel) {
				const toPixelIndex = ((y + dy) * to.width + (x + dx)) * 4;
				const fromPixelIndex = (y * from.width + x) * 4;
				if (
					!(
						maskColor.r === from.data[fromPixelIndex + 0] &&
						maskColor.g === from.data[fromPixelIndex + 1] &&
						maskColor.b === from.data[fromPixelIndex + 2]
					)
				) {
					to.data[toPixelIndex + channel] =
						from.data[fromPixelIndex + channel]!;
				}
			}
		}
	}
}

function imageDataConcatenate(
	images: ReadonlyArray<ImageData>,
	direction: "row" | "column",
	gap: number
): ImageData {
	const positioned = zipObject({
		image: images,
		pos: flexboxChildPositions(
			images.map(({ width: x, height: y }) => ({ x, y })),
			direction,
			gap
		),
	});

	const bounding = boundingBox(
		positioned.map(({ image, pos }) => ({
			pos,
			size: { x: image.width, y: image.height },
		}))
	);

	const result = new ImageData(bounding.size.x, bounding.size.y);

	for (const { image, pos } of positioned) {
		blitImageData(result, image, pos.x, pos.y);
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
