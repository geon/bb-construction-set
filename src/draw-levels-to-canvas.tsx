import { Level, levelHeight, levelWidth, numTiles } from "./level";
import { palette } from "./palette";
import { Color, mixColors, black } from "./color";

export function drawLevelsToCanvas(
	levels: readonly Level[],
	canvas: HTMLCanvasElement
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}

	canvas.width = levelWidth * 10;
	canvas.height = levelHeight * 10;

	const image = new ImageData(levelWidth, levelHeight);
	for (let levelY = 0; levelY < 10; ++levelY) {
		for (let levelX = 0; levelX < 10; ++levelX) {
			const levelIndex = levelY * 10 + levelX;
			const level = levels[levelIndex];
			if (!level) {
				throw new Error("Missing level.");
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
			// The platforms use only the dark background color, and black.
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
			drawTiles(
				image,
				level.tiles,
				// The platforms use only the 3 background colors.
				mixColors([palette[level.bgColorLight], palette[level.bgColorDark]]),
				0
			);

			ctx.putImageData(image, levelX * levelWidth, levelY * levelHeight);
		}
	}
}

function drawTiles(
	image: ImageData,
	tiles: boolean[],
	color: Color,
	offset: number
) {
	for (let tileY = 0; tileY < levelHeight; ++tileY) {
		for (let tileX = 0; tileX < levelWidth; ++tileX) {
			const tileIndex = tileY * levelWidth + tileX;
			const tileIsSet = tiles[tileIndex];
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

export function drawPlatformCharsToCanvas(
	levels: readonly Level[],
	canvas: HTMLCanvasElement
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}

	canvas.width = 4 * 8 * 10;
	canvas.height = 4 * 8 * 10;

	const image = new ImageData(8, 8);
	for (let levelY = 0; levelY < 10; ++levelY) {
		for (let levelX = 0; levelX < 10; ++levelX) {
			const levelIndex = levelY * 10 + levelX;
			const level = levels[levelIndex];
			if (!level) {
				throw new Error("Missing level.");
			}

			const charPalette = [
				palette[0],
				palette[level.bgColorDark],
				palette[level.bgColorLight],
				{ r: 255, g: 0, b: 255 }, // Invalid color for platforms. They only use the 3 background colors.
			];
			for (let sidebarY = 0; sidebarY < 4; ++sidebarY) {
				for (let sidebarX = 0; sidebarX < 4; ++sidebarX) {
					for (let charY = 0; charY < 8; ++charY) {
						for (let charX = 0; charX < 4; ++charX) {
							const color = charPalette[level.platformChar.lines[charY][charX]];
							// Double width pixels.
							const pixelIndex = charY * 8 + charX * 2;
							plotPixel(image, pixelIndex, color);
							plotPixel(image, pixelIndex + 1, color);
						}
					}
					ctx.putImageData(
						image,
						levelX * 32 + sidebarX * 8,
						levelY * 32 + sidebarY * 8
					);
				}
			}
		}
	}
}
