import { zipObject } from "../functions";
import { Char } from "../internal-data-formats/char";
import { CharBlock } from "../internal-data-formats/char-group";
import { Level } from "../internal-data-formats/level";
import {
	getSubPaletteIndex,
	PaletteIndex,
	SubPalette,
} from "../internal-data-formats/palette";
import { mapTuple } from "../tuple";
import {
	blitPaletteImage,
	createPaletteImage,
	drawGrid,
	PaletteImage,
} from "./palette-image";

export function drawChar(
	char: Char,
	charPalette: SubPalette,
	mask?: Char
): PaletteImage<4, 8> {
	return mapTuple(zipObject({ color: char, mask }), (row) =>
		mapTuple(zipObject(row), (pixel) =>
			pixel.mask === 0b11 ? undefined : charPalette[pixel.color]
		)
	);
}

export function parseChar(
	image: PaletteImage<4, 8>,
	charPalette: SubPalette
): { readonly char: Char; readonly color: PaletteIndex | undefined } {
	let color: PaletteIndex | undefined;
	return {
		char: mapTuple(image, (row) =>
			mapTuple(
				row,
				(paletteIndex) =>
					getSubPaletteIndex(
						// For transparent pixels, default to the background color.
						paletteIndex ?? 0,
						charPalette
					) ??
					// Hack: For colors outside the givien charPalette:
					// * Set the first unknown color to return
					// * Assume they are the char color
					((color = color ?? paletteIndex), 3)
			)
		),
		color,
	};
}

export function getCharPalette(level: Level): SubPalette {
	return [
		0,
		level.bgColorDark,
		level.bgColorLight,
		// The color ram gets cleared to green at the beginning of the game.
		5,
	];
}

export function drawPlatformCharsToCanvas(
	levels: readonly Level[]
): PaletteImage {
	const gap = { x: 5, y: 10 };
	return drawGrid(
		levels.map(drawLevelPlatformChars),
		10,
		{ x: 8 * 2, y: 8 * 4 },
		gap
	);
}

function drawLevelPlatformChars(level: Level): PaletteImage {
	const charPalette = getCharPalette(level);

	const platformChars = [
		[level.platformChar, level.platformChar],
		[level.platformChar, level.platformChar],
	];

	const [ul, ur, bl, br] = level.sidebarChars ?? platformChars.flat();
	const sidebarChars = [
		[ul, bl],
		[ur, br],
	];

	const sidebarImage = drawCharblock(sidebarChars, charPalette);
	const platformImage = drawCharblock(platformChars, charPalette);

	return drawGrid(
		[sidebarImage, platformImage, sidebarImage, platformImage],
		2,
		{ x: 8 * 1, y: 8 * 2 }
	);
}

function drawCharblock(
	charBlock: CharBlock<number, number>,
	charPalette: SubPalette,
	mask?: CharBlock<number, number>
): PaletteImage {
	// The chars are column-order just like in the game.
	const image = createPaletteImage({
		x: charBlock.length * 4,
		y: charBlock[0]!.length * 8,
	});

	for (const [charBlockX, column] of charBlock.entries()) {
		for (const [charBlockY, char] of column.entries()) {
			blitPaletteImage(
				image,
				drawChar(char, charPalette, mask?.[charBlockX]?.[charBlockY]),
				{
					x: charBlockX * 4,
					y: charBlockY * 8,
				}
			);
		}
	}

	return image;
}
