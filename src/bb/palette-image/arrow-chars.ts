import { byteToBits } from "../bit-twiddling";
import { mapRecord } from "../functions";
import { BubbleCurrentDirection } from "../internal-data-formats/level";
import { palette } from "../internal-data-formats/palette";
import { PaletteImage } from "./palette-image";

export const arrowImages = mapRecord(
	{
		0: [
			0b00010000, //
			0b00111000,
			0b01111100,
			0b11111110,
			0b00111000,
			0b00111000,
			0b00111000,
			0b00000000,
		],
		1: [
			0b00010000, //
			0b00011000,
			0b11111100,
			0b11111110,
			0b11111100,
			0b00011000,
			0b00010000,
			0b00000000,
		],
		2: [
			0b00111000, //
			0b00111000,
			0b00111000,
			0b11111110,
			0b01111100,
			0b00111000,
			0b00010000,
			0b00000000,
		],
		3: [
			0b00010000, //
			0b00110000,
			0b01111110,
			0b11111110,
			0b01111110,
			0b00110000,
			0b00010000,
			0b00000000,
		],
	} as const satisfies Record<BubbleCurrentDirection, unknown>,
	(charBytes): PaletteImage =>
		charBytes.map((byte: number) =>
			byteToBits(byte).map((bit) => (bit ? palette.darkGrey : undefined))
		)
);
