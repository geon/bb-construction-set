import { Char } from "../internal-data-formats/char";
import { palette, SubPalette } from "../internal-data-formats/palette";
import { plotPixel } from "./image-data";

export function drawChar(
	char: Char,
	charPalette: SubPalette,
	mask?: Char
): ImageData {
	const image = new ImageData(8, 8);

	for (const [charY, line] of char.entries()) {
		for (const [charX, colorIndex] of line.entries()) {
			const masked = mask?.[charY]?.[charX];
			if (masked !== undefined && !(masked === 0b11 || masked === 0b00)) {
				throw new Error("Invalid mask pixel");
			}
			const alpha = masked ? 0 : 255;

			const paletteIndex = charPalette[colorIndex];
			const color = palette[paletteIndex];

			// Double width pixels.
			const pixelIndex = charY * 8 + charX * 2;
			plotPixel(image, pixelIndex, color, alpha);
			plotPixel(image, pixelIndex + 1, color, alpha);
		}
	}
	return image;
}
