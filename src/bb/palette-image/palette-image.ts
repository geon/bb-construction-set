import { add, Coord2, origo } from "../../math/coord2";
import { PaletteIndex } from "../internal-data-formats/palette";

export type PaletteImage = {
	/** Double width pixels. */
	width: number;
	height: number;
	data: Array<PaletteIndex | undefined>;
};

export function blitPaletteImage(
	to: PaletteImage,
	from: PaletteImage,
	dx: number,
	dy: number
) {
	for (let y = 0; y < from.height; ++y) {
		for (let x = 0; x < from.width; ++x) {
			const toPixelIndex = (y + dy) * to.width + (x + dx);
			const fromPixelIndex = y * from.width + x;
			if (from.data[fromPixelIndex] !== undefined) {
				to.data[toPixelIndex] = from.data[fromPixelIndex];
			}
		}
	}
}

export function drawGrid(
	images: readonly PaletteImage[],
	numColumns: number,
	size: Coord2,
	gap: Coord2 = origo
): PaletteImage {
	const numRows = Math.ceil(images.length / numColumns);

	const gridImage: PaletteImage = {
		width: size.x * numColumns + gap.x * (numColumns - 1),
		height: size.y * numRows + gap.y * (numRows - 1),
		data: [],
	};

	const stepSize = add(size, gap);
	outerLoop: for (let y = 0; y < numRows; ++y) {
		for (let x = 0; x < numColumns; ++x) {
			const index = y * numColumns + x;
			const image = images[index];
			if (!image) {
				break outerLoop;
			}

			blitPaletteImage(gridImage, image, x * stepSize.x, y * stepSize.y);
		}
	}

	return gridImage;
}
