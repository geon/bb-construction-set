import { Color } from "../../math/color";
import { Coord2 } from "../../math/coord2";
import { flexboxChildPositions, boundingBox } from "../../math/rect";
import { zipObject } from "../functions";

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

export function imageDataConcatenate(
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

export function drawGrid(
	images: readonly ImageData[],
	numColumns: number,
	size: Coord2,
	gap: number = 0
): ImageData {
	const numRows = Math.ceil(images.length / numColumns);

	const gridImage = new ImageData(
		size.x * numColumns + gap * (numColumns - 1),
		size.y * numRows + gap * (numRows - 1)
	);

	outerLoop: for (let y = 0; y < numRows; ++y) {
		for (let x = 0; x < numColumns; ++x) {
			const index = y * numColumns + x;
			const image = images[index];
			if (!image) {
				break outerLoop;
			}

			blitImageData(gridImage, image, x * (size.x + gap), y * (size.y + gap));
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
