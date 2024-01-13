import { Level, levelHeight, levelWidth } from "./level";

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

			// Draw level.
			const randomColor = [
				Math.random() * 255,
				Math.random() * 255,
				Math.random() * 255,
				255,
			];
			for (let tileY = 0; tileY < levelHeight; ++tileY) {
				for (let tileX = 0; tileX < levelWidth; ++tileX) {
					const tileIndex = tileY * levelWidth + tileX;
					const tileIsSet = levels[levelIndex].tiles[tileIndex];
					if (tileIsSet) {
						image.data[tileIndex * 4 + 0] = randomColor[0];
						image.data[tileIndex * 4 + 1] = randomColor[1];
						image.data[tileIndex * 4 + 2] = randomColor[2];
						image.data[tileIndex * 4 + 3] = randomColor[3];
					}
				}
			}

			ctx.putImageData(image, levelX * levelWidth, levelY * levelHeight);
		}
	}
}
