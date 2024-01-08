import { Level, levelHeight, levelWidth } from "./level";

export function drawLevelsToCanvas(
	levels: readonly Level[],
	canvas: HTMLCanvasElement
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}

	const image = new ImageData(levelWidth * 10, levelHeight * 10);
	for (let levelY = 0; levelY < 10; ++levelY) {
		for (let levelX = 0; levelX < 10; ++levelX) {
			const levelIndex = levelY * 10 + levelX;
			const level = levels[levelIndex];
			if (!level) {
				throw new Error("Missing level.");
			}
			const randomColor = [
				Math.random() * 255,
				Math.random() * 255,
				Math.random() * 255,
			];
			for (let tileY = 0; tileY < levelHeight; ++tileY) {
				for (let tileX = 0; tileX < levelWidth; ++tileX) {
					const tileIndex = tileY * levelWidth + tileX;
					const tileIsSet = levels[levelIndex].tiles[tileIndex];
					const pixelIndex =
						levelY * 10 * levelWidth * levelHeight +
						levelX * levelWidth +
						tileY * (levelWidth * 10) +
						tileX;
					image.data[pixelIndex * 4 + 0] = tileIsSet ? randomColor[0] : 0;
					image.data[pixelIndex * 4 + 1] = tileIsSet ? randomColor[1] : 0;
					image.data[pixelIndex * 4 + 2] = tileIsSet ? randomColor[2] : 0;
					image.data[pixelIndex * 4 + 3] = 255;
				}
			}
		}
	}

	canvas.width = image.width;
	canvas.height = image.height;
	ctx.putImageData(image, 0, 0);
}
