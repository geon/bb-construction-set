import { add, Coord2, origo, subtract } from "../../math/coord2";
import {
	bottomRight,
	LayoutRect,
	leafs,
	Rect,
	rectIntersection,
} from "../../math/rect";
import { checkedAccess, range, strictChunk, zipObject } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import { MutableTuple, Tuple } from "../tuple";

/** Double width pixels. */
export type PaletteImage<
	Width extends number = number,
	Height extends number = number,
> = MutableTuple<MutableTuple<PaletteIndex | undefined, Width>, Height>;

export function createPaletteImage<
	Height extends number = number,
	Width extends number = number,
>(size: { x: Width; y: Height }): PaletteImage {
	return range(size.y).map(() => range(size.x).map(() => undefined));
}

export function getPaletteImageSize(image: PaletteImage): Coord2 {
	return { x: image[0]?.length ?? 0, y: image.length };
}

export function blitPaletteImage(
	to: PaletteImage,
	from: PaletteImage,
	pos: Coord2,
) {
	// All rects in to-space coordinates.
	const toRect = {
		pos: origo,
		size: getPaletteImageSize(to),
	};
	const fromRect = {
		pos,
		size: getPaletteImageSize(from),
	};
	const clippedFromRect = rectIntersection(toRect, fromRect);

	if (!clippedFromRect) {
		return;
	}

	const clippedFromRectInFromSpace = {
		pos: subtract(clippedFromRect.pos, pos),
		size: clippedFromRect.size,
	};
	const clippedFrom = cropPaletteImage(from, clippedFromRectInFromSpace);

	blitUnclippedPaletteImage(to, clippedFrom, clippedFromRect.pos);
}

export function blitUnclippedPaletteImage(
	to: PaletteImage,
	from: PaletteImage,
	pos: Coord2,
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
	rect: Rect,
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
	gap: Coord2 = origo,
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
	images: ReadonlyArray<PaletteImage>,
): PaletteImage {
	return leafs(layout).reduce((soFar, current) => {
		blitPaletteImage(soFar, checkedAccess(images, current.index), current.pos);
		return soFar;
	}, createPaletteImage(layout.size));
}

export function mapLayout(
	layout: LayoutRect,
	transform: (rect: Rect) => Rect,
): LayoutRect {
	const newRect = transform(layout);
	if (!("children" in layout)) {
		return {
			...newRect,
			index: layout.index,
		};
	} else {
		return {
			...newRect,
			children: layout.children.map((child) => mapLayout(child, transform)),
		};
	}
}

export function parseLayout(
	layout: LayoutRect,
	image: PaletteImage,
): ReadonlyArray<PaletteImage> {
	return leafs(layout).map((rect) => cropPaletteImage(image, rect));
}

export function doubleImageWidth(image: PaletteImage): PaletteImage {
	return image.map((row) => row.flatMap((x) => [x, x]));
}

export function halfImageWidth(image: PaletteImage): PaletteImage {
	return image.map((row) => strictChunk(row, 2).map(([x, _x]) => x));
}

export function paletteImagesEqual(a: PaletteImage, b: PaletteImage): boolean {
	return zipObject({
		a: a.flat(),
		b: b.flat(),
	}).every(({ a, b }) => a === b);
}

export function drawRect(
	image: PaletteImage,
	rect: Rect,
	colors: Tuple<PaletteIndex, 2>,
): void {
	for (const index of range(rect.size.x)) {
		const x = rect.pos.x + index;
		image[rect.pos.y]![x] = colors[x % 2];
		image[rect.pos.y + rect.size.y - 1]![x] = colors[(x + 1) % 2];
	}
	const rangeY = rect.size.y - 2;
	if (rangeY > 0) {
		for (const index of range(rangeY)) {
			const y = rect.pos.y + index + 1;
			image[y]![rect.pos.x] = colors[y % 2];
			image[y]![rect.pos.x + rect.size.x - 1] = colors[(y + 1) % 2];
		}
	}
}
