import { zipObject } from "../functions";
import { PaletteIndex } from "../palette";
import { ReadonlyUint8Array } from "./types";

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

export function patchBgColors(
	bytes: Uint8Array,
	bgColorLight: readonly PaletteIndex[],
	bgColorDark: readonly PaletteIndex[]
) {
	bytes.set(
		zipObject({ bgColorLight, bgColorDark }).map(
			({ bgColorLight, bgColorDark }) => bgColorLight + (bgColorDark << 4)
		)
	);
}
