import { BgColors } from "../internal-data-formats/bg-colors";
import { PaletteIndex } from "../internal-data-formats/palette";
import { ReadonlyUint8Array } from "../types";

export function readBgColors(bytes: ReadonlyUint8Array): {
	readonly bgColorLight: readonly PaletteIndex[];
	readonly bgColorDark: readonly PaletteIndex[];
} {
	return {
		bgColorLight: [...bytes].map(
			(bgColorMetadata) => (bgColorMetadata & 0b1111) as PaletteIndex
		),
		bgColorDark: [...bytes].map(
			(bgColorMetadata) => ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex
		),
	};
}

export function writeBgColors(bgColors: ReadonlyArray<BgColors>): Uint8Array {
	return new Uint8Array(
		bgColors.map(
			({ bgColorLight, bgColorDark }) => bgColorLight + (bgColorDark << 4)
		)
	);
}
