import { Level, levelHeight, levelWidth, numTiles } from "./level";
import { Color, palette } from "./palette";

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
			drawTiles(image, level.tiles, shadowColor, 1);
			drawTiles(image, level.tiles, shadowColor, levelWidth);
			drawTiles(image, level.tiles, shadowColor, levelWidth + 1);

			// Draw level.
			drawTiles(image, level.tiles, palette[Math.floor(Math.random() * 16)], 0);

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
				image.data[pixelIndex * 4 + 0] = color.r;
				image.data[pixelIndex * 4 + 1] = color.g;
				image.data[pixelIndex * 4 + 2] = color.b;
				image.data[pixelIndex * 4 + 3] = 255;
			}
		}
	}
}
