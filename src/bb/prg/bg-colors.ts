import { BgColors } from "../internal-data-formats/bg-colors";
import { PaletteIndex } from "../internal-data-formats/palette";
import { ReadonlyUint8Array } from "../types";

export function readBgColors(
	bytes: ReadonlyUint8Array
): ReadonlyArray<BgColors> {
	return [...bytes].map((bgColorMetadata) => ({
		light: (bgColorMetadata & 0b1111) as PaletteIndex,
		dark: ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex,
	}));
}

export function writeBgColors(bgColors: ReadonlyArray<BgColors>): Uint8Array {
	return new Uint8Array(bgColors.map(({ light, dark }) => light + (dark << 4)));
}
