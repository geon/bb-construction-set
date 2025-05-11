import { Color } from "../../math/color";
import { add, Coord2, origo } from "../../math/coord2";
import { palette } from "../internal-data-formats/palette";
import {
	getPaletteImageSize,
	PaletteImage,
} from "../palette-image/palette-image";

// Just like ctx.putImageData
export function blitImageData(
	to: ImageData,
	from: ImageData,
	dx: number,
	dy: number
) {
	for (let y = 0; y < from.height; ++y) {
		const toStart = ((y + dy) * to.width + dx) * 4;
		const fromStart = y * from.width * 4;
		to.data.set(
			from.data.slice(fromStart, fromStart + from.width * 4),
			toStart
		);
	}
}

export function blitImageDataMasked(
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

export function drawGrid(
	images: readonly ImageData[],
	numColumns: number,
	size: Coord2,
	gap: Coord2 = origo
): ImageData {
	const numRows = Math.ceil(images.length / numColumns);

	const gridImage = new ImageData(
		size.x * numColumns + gap.x * (numColumns - 1),
		size.y * numRows + gap.y * (numRows - 1)
	);

	const stepSize = add(size, gap);
	outerLoop: for (let y = 0; y < numRows; ++y) {
		for (let x = 0; x < numColumns; ++x) {
			const index = y * numColumns + x;
			const image = images[index];
			if (!image) {
				break outerLoop;
			}

			blitImageData(gridImage, image, x * stepSize.x, y * stepSize.y);
		}
	}

	return gridImage;
}

export function plotPixel(
	image: ImageData,
	pixelIndex: number,
	color: Color,
	alpha: number = 255
): void {
	image.data[pixelIndex * 4 + 0] = color.r;
	image.data[pixelIndex * 4 + 1] = color.g;
	image.data[pixelIndex * 4 + 2] = color.b;
	image.data[pixelIndex * 4 + 3] = alpha;
}

export function imageDataFromPaletteImage(image: PaletteImage): ImageData {
	const size = getPaletteImageSize(image);
	const imageData = new ImageData(size.x, size.y);
	for (const [y, row] of image.entries()) {
		for (const [x, paletteIndex] of row.entries()) {
			const index = y * size.x + x;

			if (paletteIndex !== undefined) {
				const color = palette[paletteIndex];
				plotPixel(imageData, index, color);
			}
		}
	}

	return imageData;
}

export function imageDataToBlob(image: ImageData): Promise<Blob> {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Missing canvas 2d context.");
	}
	canvas.width = image.width;
	canvas.height = image.height;
	ctx.putImageData(image, 0, 0);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject()));
	});
}
