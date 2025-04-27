import { CharsetChar } from "../internal-data-formats/charset-char";
import { SubPalette } from "../internal-data-formats/palette";
import { plotPixel } from "./image-data";

export function drawChar(
	char: CharsetChar,
	charPalette: SubPalette,
	mask?: CharsetChar
): ImageData {
	const image = new ImageData(8, 8);

	for (const [charY, line] of char.lines.entries()) {
		for (const [charX, colorIndex] of line.entries()) {
			const masked = mask?.lines?.[charY]?.[charX];
			if (masked !== undefined && !(masked === 0b11 || masked === 0b00)) {
				throw new Error("Invalid mask pixel");
			}
			const alpha = masked ? 0 : 255;

			const color = charPalette[colorIndex];
			// Double width pixels.
			const pixelIndex = charY * 8 + charX * 2;
			plotPixel(image, pixelIndex, color, alpha);
			plotPixel(image, pixelIndex + 1, color, alpha);
		}
	}
	return image;
}
