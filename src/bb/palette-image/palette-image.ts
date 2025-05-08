import { add, Coord2, origo } from "../../math/coord2";
import { LayoutRect, leafs } from "../../math/rect";
import { range, zipObject } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import { Tuple } from "../tuple";

/** Double width pixels. */
export type PaletteImage<
	Width extends number = number,
	Height extends number = number
> = Tuple<Tuple<PaletteIndex | undefined, Width>, Height>;

export function createPaletteImage<
	Height extends number = number,
	Width extends number = number
>(size: { x: Width; y: Height }): PaletteImage {
	return range(0, size.y).map(() => range(0, size.x).map(() => undefined));
}

export function getPaletteImageSize(image: PaletteImage): Coord2 {
	return { x: image[0]?.length ?? 0, y: image.length };
}

export function blitPaletteImage(
	to: PaletteImage,
	from: PaletteImage,
	pos: Coord2
) {
	for (const row of zipObject({
		to: to.slice(pos.y, pos.y + from.length),
		from,
	})) {
		for (const [x, pixel] of row.from.entries()) {
			if (pixel !== undefined) {
				row.to[pos.x + x] = pixel;
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

	const gridImage = createPaletteImage({
		x: size.x * numColumns + gap.x * (numColumns - 1),
		y: size.y * numRows + gap.y * (numRows - 1),
	});

	const stepSize = add(size, gap);
	outerLoop: for (let y = 0; y < numRows; ++y) {
		for (let x = 0; x < numColumns; ++x) {
			const index = y * numColumns + x;
			const image = images[index];
			if (!image) {
				break outerLoop;
			}

			blitPaletteImage(gridImage, image, {
				x: x * stepSize.x,
				y: y * stepSize.y,
			});
		}
	}

	return gridImage;
}

export function drawLayout(
	layout: LayoutRect,
	images: ReadonlyArray<PaletteImage>
): PaletteImage {
	return zipObject({
		image: images,
		rect: leafs(layout),
	}).reduce((soFar, current) => {
		blitPaletteImage(soFar, current.image, current.rect.pos);
		return soFar;
	}, createPaletteImage(layout.size));
}
