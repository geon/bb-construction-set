import { zipObject } from "../functions";
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

export function writeBgColors(
	bgColorLight: readonly PaletteIndex[],
	bgColorDark: readonly PaletteIndex[]
): Uint8Array {
	return new Uint8Array(
		zipObject({ bgColorLight, bgColorDark }).map(
			({ bgColorLight, bgColorDark }) => bgColorLight + (bgColorDark << 4)
		)
	);
}
