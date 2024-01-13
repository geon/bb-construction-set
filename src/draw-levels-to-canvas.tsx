import { Level, levelHeight, levelWidth, numTiles } from "./level";

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
			for (let tileY = 0; tileY < levelHeight; ++tileY) {
				for (let tileX = 0; tileX < levelWidth; ++tileX) {
					const tileIndex = tileY * levelWidth + tileX;
					image.data[tileIndex * 4 + 0] = 0;
					image.data[tileIndex * 4 + 1] = 0;
					image.data[tileIndex * 4 + 2] = 0;
					image.data[tileIndex * 4 + 3] = 255;
				}
			}

			const shadowColor = [
				Math.random() * 255,
				Math.random() * 255,
				Math.random() * 255,
				255,
			];
			// Draw shadows.
			drawTiles(image, level.tiles, shadowColor, 1);
			drawTiles(image, level.tiles, shadowColor, levelWidth);
			drawTiles(image, level.tiles, shadowColor, levelWidth + 1);

			// Draw level.
			drawTiles(
				image,
				level.tiles,
				[Math.random() * 255, Math.random() * 255, Math.random() * 255, 255],
				0
			);

			ctx.putImageData(image, levelX * levelWidth, levelY * levelHeight);
		}
	}
}

function drawTiles(
	image: ImageData,
	tiles: boolean[],
	color: number[],
	offset: number
) {
	for (let tileY = 0; tileY < levelHeight; ++tileY) {
		for (let tileX = 0; tileX < levelWidth; ++tileX) {
			const tileIndex = tileY * levelWidth + tileX;
			const tileIsSet = tiles[tileIndex];
			const pixelIndex = tileIndex + offset;
			if (tileIsSet && pixelIndex < numTiles) {
				image.data[pixelIndex * 4 + 0] = color[0];
				image.data[pixelIndex * 4 + 1] = color[1];
				image.data[pixelIndex * 4 + 2] = color[2];
				image.data[pixelIndex * 4 + 3] = color[3];
			}
		}
	}
}
