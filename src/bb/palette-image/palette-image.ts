import { add, Coord2, origo } from "../../math/coord2";
import { bottomRight, LayoutRect, leafs, Rect } from "../../math/rect";
import { range, strictChunk, zipObject } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import { MutableTuple } from "../tuple";

/** Double width pixels. */
export type PaletteImage<
	Width extends number = number,
	Height extends number = number
> = MutableTuple<MutableTuple<PaletteIndex | undefined, Width>, Height>;

export function createPaletteImage<
	Height extends number = number,
	Width extends number = number
>(size: { x: Width; y: Height }): PaletteImage {
	return range(size.y).map(() => range(size.x).map(() => undefined));
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

export function cropPaletteImage(
	image: PaletteImage,
	rect: Rect
): PaletteImage {
	const br = bottomRight(rect);

	const imageSize = getPaletteImageSize(image);
	if (
		rect.pos.x < 0 ||
		rect.pos.y < 0 ||
		br.x > imageSize.x ||
		br.y > imageSize.y
	) {
		throw new Error("Crop rect outside image.");
	}

	return image
		.slice(rect.pos.y, br.y)
		.map((row) => row.slice(rect.pos.x, br.x));
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

export function parseLayout(
	layout: LayoutRect,
	image: PaletteImage
): ReadonlyArray<PaletteImage> {
	return leafs(layout).map((rect) => cropPaletteImage(image, rect));
}

export function doubleImageWidth(image: PaletteImage): PaletteImage {
	return image.map((row) => row.flatMap((x) => [x, x]));
}

export function halfImageWidth(image: PaletteImage): PaletteImage {
	return image.map((row) => strictChunk(row, 2).map(([x, _x]) => x));
}
