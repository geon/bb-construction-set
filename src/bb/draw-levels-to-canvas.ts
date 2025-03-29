import { Level, levelHeight, levelWidth, numTiles, Tiles } from "./level";
import { palette, PaletteIndex } from "./palette";
import { Color, mixColors, black } from "./color";
import { CharBlock, CharBlockIndex, CharsetChar } from "./charset-char";
import {
	CharacterName,
	SpriteGroup,
	SpriteGroupName,
	spriteHeight,
	spriteWidthBytes,
} from "./sprite";

export function drawLevelsToCanvas(
	levels: readonly Level[],
	spriteColors: Record<CharacterName, PaletteIndex>,
	canvas: HTMLCanvasElement
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}

	canvas.width = levelWidth * 10;
	canvas.height = levelHeight * 10;
	clearCanvas(canvas);

	const image = new ImageData(levelWidth, levelHeight);
	outerLoop: for (let levelY = 0; levelY < 10; ++levelY) {
		for (let levelX = 0; levelX < 10; ++levelX) {
			const levelIndex = levelY * 10 + levelX;
			const level = levels[levelIndex];
			if (!level) {
				break outerLoop;
			}

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

			ctx.putImageData(image, levelX * levelWidth, levelY * levelHeight);
		}
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
			if (tileIsSet && pixelIndex < numTiles) {
				plotPixel(image, pixelIndex, color);
			}
		}
	}
}

function plotPixel(image: ImageData, pixelIndex: number, color: Color) {
	image.data[pixelIndex * 4 + 0] = color.r;
	image.data[pixelIndex * 4 + 1] = color.g;
	image.data[pixelIndex * 4 + 2] = color.b;
	image.data[pixelIndex * 4 + 3] = 255;
}

export function clearCanvas(canvas: HTMLCanvasElement) {
	canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawPlatformCharsToCanvas(levels: readonly Level[]): ImageData {
	const width = 4 * 8 * 10;
	const height = 4 * 8 * 10;

	const image = new ImageData(width, height);

	outerLoop: for (let levelY = 0; levelY < 10; ++levelY) {
		for (let levelX = 0; levelX < 10; ++levelX) {
			const levelIndex = levelY * 10 + levelX;
			const level = levels[levelIndex];
			if (!level) {
				break outerLoop;
			}

			const charPalette = getCharPalette(level);
			for (let sidebarY = 0; sidebarY < 4; ++sidebarY) {
				for (let sidebarX = 0; sidebarX < 4; ++sidebarX) {
					const char =
						level.sidebarChars && sidebarX < 2
							? level.sidebarChars[
									((sidebarY % 2) * 2 + sidebarX) as CharBlockIndex
							  ]
							: level.platformChar;

					blitImageData(
						image,
						drawChar(char, charPalette),
						levelX * 32 + sidebarX * 8,
						levelY * 32 + sidebarY * 8
					);
				}
			}
		}
	}
	return image;
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
	charPalette: readonly [Color, Color, Color, Color]
) {
	const image = new ImageData(8, 8);

	for (const [charY, line] of char.lines.entries()) {
		for (const [charX, colorIndex] of line.entries()) {
			const color = charPalette[colorIndex];
			// Double width pixels.
			const pixelIndex = charY * 8 + charX * 2;
			plotPixel(image, pixelIndex, color);
			plotPixel(image, pixelIndex + 1, color);
		}
	}
	return image;
}

export function drawSpritesToCanvas(
	spriteGroups: Record<SpriteGroupName, SpriteGroup>,
	canvas: HTMLCanvasElement
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}

	const characherSpriteGroups = Object.values(spriteGroups);
	const numCharacters = characherSpriteGroups.length;
	const spriteWidthPixels = spriteWidthBytes * 8;
	const maxSpritesForCharacter = characherSpriteGroups.reduce(
		(soFar, current) => Math.max(soFar, current.sprites.length),
		0
	);

	canvas.width = spriteWidthPixels * maxSpritesForCharacter;
	canvas.height = spriteHeight * numCharacters;

	ctx.fillStyle = "black";
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.fill();

	const image = new ImageData(spriteWidthPixels, spriteHeight);
	for (const [spriteY, characterSprites] of characherSpriteGroups.entries()) {
		for (const [spriteX, sprite] of characterSprites.sprites.entries()) {
			const spritePalette = getSpritePalette(characterSprites.color);
			for (let pixelY = 0; pixelY < spriteHeight; ++pixelY) {
				for (let byteX = 0; byteX < spriteWidthBytes; ++byteX) {
					const byte = sprite.bitmap[pixelY * spriteWidthBytes + byteX]!;
					for (let pixelX = 0; pixelX < 4; ++pixelX) {
						const color = spritePalette[(byte >> ((3 - pixelX) * 2)) & 0b11]!;

						// Double width pixels.
						const pixelIndex =
							pixelY * spriteWidthPixels + byteX * 8 + pixelX * 2;
						plotPixel(image, pixelIndex, color);
						plotPixel(image, pixelIndex + 1, color);
					}
				}
			}

			ctx.putImageData(
				image,
				spriteX * spriteWidthPixels,
				spriteY * spriteHeight
			);
		}
	}
}

function getSpritePalette(color: PaletteIndex): [Color, Color, Color, Color] {
	return [
		palette[0], // Transparent (Black)
		palette[2], // Dark red
		palette[color],
		palette[1], // White
	];
}

export function drawItemsToCanvas(items: readonly CharBlock[]): ImageData {
	const numItemsX = 16;
	const numItemsY = Math.ceil(items.length / numItemsX);

	const width = 3 * 8 * numItemsX;
	const height = 3 * 8 * numItemsY;

	const image = new ImageData(width, height);

	outerLoop: for (let itemY = 0; itemY < numItemsY; ++itemY) {
		for (let levelX = 0; levelX < numItemsX; ++levelX) {
			const itemIndex = itemY * numItemsX + levelX;
			const item = items[itemIndex];
			if (!item) {
				break outerLoop;
			}

			for (let charBlockY = 0; charBlockY < 2; ++charBlockY) {
				for (let charBlockX = 0; charBlockX < 2; ++charBlockX) {
					const backgroundColor =
						charBlockX % 2 ^ charBlockY % 2
							? palette[0]
							: { r: 20, g: 30, b: 30 }; // Alternating black and dark gray.

					const charPalette = [
						backgroundColor,
						palette[9], // Brown
						palette[1], // White
						palette[5], // Green
					] as const;

					const char = item[(charBlockY * 2 + charBlockX) as CharBlockIndex];

					blitImageData(
						image,
						drawChar(char, charPalette),
						levelX * (2 * 8) + charBlockX * 8,
						itemY * (2 * 8) + charBlockY * 8
					);
				}
			}
		}
	}

	return image;
}

// Just like ctx.putImageData
function blitImageData(to: ImageData, from: ImageData, dx: number, dy: number) {
	for (let y = 0; y < from.height; ++y) {
		for (let x = 0; x < from.height; ++x) {
			for (let channel = 0; channel < 4; ++channel) {
				to.data[((y + dy) * to.height + (x + dx)) * 4 + channel] =
					from.data[(y * from.height + x) * 4 + channel]!;
			}
		}
	}
}
