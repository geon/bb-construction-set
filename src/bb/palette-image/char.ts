import { bitsToByte, byteToBits } from "../bit-twiddling";
import { zipObject } from "../functions";
import { BgColors } from "../internal-data-formats/bg-colors";
import { Char } from "../internal-data-formats/char";
import { CharBlock } from "../internal-data-formats/char-group";
import {
	parseColorPixelByte,
	serializeColorPixelByte,
} from "../internal-data-formats/color-pixel-byte";
import { Level } from "../internal-data-formats/level";
import {
	getSubPaletteIndex,
	palette,
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

export function drawHiresChar(
	char: Char,
	paletteIndex: PaletteIndex
): PaletteImage<8, 8> {
	return mapTuple(char, (row) =>
		mapTuple(byteToBits(serializeColorPixelByte(row)), (pixel) =>
			pixel ? paletteIndex : 0
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

export function parseHiresChar(image: PaletteImage<8, 8>): {
	readonly char: Char;
	readonly color: PaletteIndex | undefined;
} {
	let color: PaletteIndex | undefined;
	return {
		char: mapTuple(image, (row) =>
			// Reinterpret the hires char as multicolor.
			parseColorPixelByte(
				bitsToByte(mapTuple(row, (paletteIndex) => paletteIndex !== 0))
			)
		),
		color,
	};
}

export function getLevelCharPalette(bgColors: BgColors): SubPalette {
	return getCharPalette(
		// The color ram gets cleared to green at the beginning of the game.
		palette.green,
		bgColors
	);
}

export function getCharPalette(
	charColor: PaletteIndex,
	bgColors: BgColors
): SubPalette {
	return [
		// The background is black by default.
		palette.black,
		bgColors.dark,
		bgColors.light,
		charColor,
	];
}

type PlatformCharsData = Pick<
	Level,
	"platformChar" | "sidebarChars" | "bgColors"
>;

export function drawPlatformChars(
	levels: readonly PlatformCharsData[]
): PaletteImage {
	const gap = { x: 5, y: 10 };
	return drawGrid(
		levels.map(drawLevelPlatformChars),
		10,
		{ x: 8 * 2, y: 8 * 4 },
		gap
	);
}

export function drawLevelPlatformChars(level: PlatformCharsData): PaletteImage {
	const charPalette = getLevelCharPalette(level.bgColors);

	const platformChars = [
		[level.platformChar, level.platformChar],
		[level.platformChar, level.platformChar],
	];

	const [ul, ur, bl, br] = level.sidebarChars ?? platformChars.flat();
	const sidebarChars = [
		[ul, bl],
		[ur, br],
	];

	const sidebarImage = drawCharBlock(sidebarChars, charPalette);
	const platformImage = drawCharBlock(platformChars, charPalette);

	return drawGrid(
		[sidebarImage, platformImage, sidebarImage, platformImage],
		2,
		{ x: 8 * 1, y: 8 * 2 }
	);
}

export function drawCharBlock(
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
