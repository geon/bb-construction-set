import { Coord2, origo } from "../../math/coord2";
import { grid, LayoutRect } from "../../math/rect";
import { bitsToByte, byteToBits } from "../bit-twiddling";
import { range, zipObject } from "../functions";
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
import { assertTuple, mapTuple, Tuple } from "../tuple";
import {
	blitPaletteImage,
	createPaletteImage,
	drawLayout,
	PaletteImage,
	paletteImagesEqual,
	parseLayout,
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

export type PlatformCharsData = Pick<
	Level,
	"platformChar" | "sidebarChars" | "bgColors"
>;

export function layOutChars(): LayoutRect {
	const pos = origo;
	const size: Coord2 = { x: 4, y: 8 };
	return grid(
		[
			[
				{ index: 0, pos, size },
				{ index: 1, pos, size },
				{ index: 6, pos, size },
				{ index: 4, pos, size },
			],
			[
				{ index: 2, pos, size },
				{ index: 3, pos, size },
				{ index: 6, pos, size },
				{ index: 5, pos, size },
			],
		].flat(),
		4,
		origo
	);
}

export function drawLevelPlatformChars(level: PlatformCharsData): PaletteImage {
	const charPalette = getLevelCharPalette(level.bgColors);
	const drawCharWithPalette = (char: Char) => drawChar(char, charPalette);

	const sidebarChars = level.sidebarChars ?? [
		level.platformChar,
		level.platformChar,
		level.platformChar,
		level.platformChar,
	];

	const emptyLine = [undefined, undefined, undefined, undefined];
	const bgColorsLine = [
		level.bgColors.dark,
		level.bgColors.dark,
		level.bgColors.light,
		level.bgColors.light,
	];
	const bgColorsCharImage: PaletteImage = [
		emptyLine,
		emptyLine,
		emptyLine,
		emptyLine,
		bgColorsLine,
		bgColorsLine,
		bgColorsLine,
		bgColorsLine,
	];
	const emptyCharImage = createPaletteImage({ x: 4, y: 8 });

	return drawLayout(
		layOutChars(),
		[
			[...sidebarChars, level.platformChar].map(drawCharWithPalette),
			[bgColorsCharImage, emptyCharImage],
		].flat()
	);
}

export function parseLevelPlatformChars(
	image: PaletteImage
): PlatformCharsData {
	const charImages = parseLayout(layOutChars(), image) as PaletteImage<4, 8>[];
	const sidebarCharImages = assertTuple(charImages.slice(0, 4), 4);
	const platformCharImage = charImages[4]!;
	const bgColorsImage = charImages[5]!;

	const bgColors: BgColors = {
		// When the image is transparent, assume black.
		dark: bgColorsImage[7][0] ?? palette.black,
		light: bgColorsImage[7][3] ?? palette.black,
	};
	const charPalette = getLevelCharPalette(bgColors);

	const sidebarChars = sidebarCharImages.some(
		(sidebarCharImage) =>
			!paletteImagesEqual(sidebarCharImage, platformCharImage)
	)
		? mapTuple(
				sidebarCharImages,
				(charImage) => parseChar(charImage, charPalette).char
		  )
		: undefined;

	const platformChar = parseChar(platformCharImage, charPalette).char;

	return { bgColors, sidebarChars, platformChar };
}

export function drawCharBlock(
	charBlock: CharBlock,
	charPalette: SubPalette,
	mask?: CharBlock
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

function layOutAllLevelsPlatformChars() {
	const gap = { x: 4, y: 8 };
	const size = { x: 4 * 4, y: 8 * 2 };
	return grid(
		range(100).map((index) => ({
			index,
			size,
			pos: origo,
		})),
		10,
		gap
	);
}

export function drawPlatformChars(
	levels: Tuple<PlatformCharsData, 100>
): PaletteImage {
	const layout = layOutAllLevelsPlatformChars();
	return drawLayout(layout, levels.map(drawLevelPlatformChars));
}

export function parsePlatformChars(
	image: PaletteImage
): Tuple<PlatformCharsData, 100> {
	const layout = layOutAllLevelsPlatformChars();
	return assertTuple(
		parseLayout(layout, image).map(parseLevelPlatformChars),
		100
	);
}
