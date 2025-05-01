import { byteToBits, bitsToByte } from "../bit-twiddling";
import { strictChunk } from "../functions";
import { Char } from "../internal-data-formats/char";
import { SubPaletteIndex } from "../internal-data-formats/palette";
import { CharBitmap } from "../pe/pe-file";
import { assertTuple, mapTuple, ReadonlyTuple } from "../tuple";
import { DataSegment } from "./io";

export const shadowChars = {
	originalC64: [
		[
			0b00000000, // Comment to prevent formatting.
			0b01010101,
			0b00010101,
			0b00000101,
			0b00000000,
			0b00000000,
			0b00000000,
			0b00000000,
		],
		[
			0b00010100, //
			0b01010100,
			0b01010100,
			0b01010100,
			0b00000000,
			0b00000000,
			0b00000000,
			0b00000000,
		],
		[
			0b00010000, //
			0b00010000,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
		],
		[
			0b00000000, //
			0b01010101,
			0b01010101,
			0b01010101,
			0b00000000,
			0b00000000,
			0b00000000,
			0b00000000,
		],
		[
			0b00010100, //
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
		],
		[
			0b00000000, //
			0b00010101,
			0b00010101,
			0b00010101,
			0b00010100,
			0b00010100,
			0b00010100,
			0b00010100,
		],
	],

	retroForge: [
		[
			0b01000100, // Comment to prevent formatting.
			0b00010001,
			0b00000100,
			0b00000001,
			0b00000000,
			0b00000000,
			0b00000000,
			0b00000000,
		],
		[
			0b01000000, //
			0b00010000,
			0b01000000,
			0b00010000,
			0b00000000,
			0b00000000,
			0b00000000,
			0b00000000,
		],
		[
			0b01000000, //
			0b00010000,
			0b01000000,
			0b00010000,
			0b01000000,
			0b00010000,
			0b01000000,
			0b00010000,
		],
		[
			0b01000100, //
			0b00010001,
			0b01000100,
			0b00010001,
			0b00000000,
			0b00000000,
			0b00000000,
			0b00000000,
		],
		[
			0b01000000, //
			0b00010000,
			0b01000000,
			0b00010000,
			0b01000000,
			0b00010000,
			0b01000000,
			0b00010000,
		],
		[
			0b01000100, //
			0b00010001,
			0b01000100,
			0b00010001,
			0b01000000,
			0b00010000,
			0b01000000,
			0b00010000,
		],
	],
} satisfies Record<string, ReadonlyTuple<CharBitmap, 6>>;

export type ShadowStyle = keyof typeof shadowChars;

export function peCharToLevelChar(char: CharBitmap): Char {
	return {
		lines: mapTuple(mapTuple(char, byteToBits), (line) =>
			assertTuple(
				strictChunk(line, 2).map((bits) => bitsToByte(bits) as SubPaletteIndex),
				4
			)
		),
	};
}

export function detectShadowStyle(dataSegment: DataSegment): ShadowStyle {
	return dataSegment.buffer[0] === shadowChars.originalC64[0][0]
		? "originalC64"
		: "retroForge";
}
