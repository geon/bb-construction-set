import { Char } from "../internal-data-formats/char";
import { Item } from "../internal-data-formats/item";
import { Level } from "../internal-data-formats/level";
import { SubPalette } from "../internal-data-formats/palette";
import { blitPaletteImage, drawGrid, PaletteImage } from "./palette-image";

export function drawChar(
	char: Char,
	charPalette: SubPalette,
	mask?: Char
): PaletteImage {
	const image: PaletteImage = { width: 4, height: 8, data: [] };

	for (const [charY, line] of char.entries()) {
		for (const [charX, colorIndex] of line.entries()) {
			const masked = mask?.[charY]?.[charX];
			if (masked !== undefined && !(masked === 0b11 || masked === 0b00)) {
				throw new Error("Invalid mask pixel");
			}
			const paletteIndex = masked ? undefined : charPalette[colorIndex];
			const pixelIndex = charY * 4 + charX;
			image.data[pixelIndex] = paletteIndex;
		}
	}
	return image;
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
	item: Item<number, number>,
	charPalette: SubPalette,
	mask?: Item<number, number>
): PaletteImage {
	// The chars are column-order just like in the game.
	const image: PaletteImage = {
		width: item.length * 4,
		height: item[0]!.length * 8,
		data: [],
	};

	for (const [charBlockX, column] of item.entries()) {
		for (const [charBlockY, char] of column.entries()) {
			blitPaletteImage(
				image,
				drawChar(char, charPalette, mask?.[charBlockX]?.[charBlockY]),
				charBlockX * 4,
				charBlockY * 8
			);
		}
	}

	return image;
}
