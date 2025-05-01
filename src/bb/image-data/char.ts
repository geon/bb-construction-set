import { Char } from "../internal-data-formats/char";
import { SubPalette } from "../internal-data-formats/palette";
import { PaletteImage } from "./palette-image";

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
