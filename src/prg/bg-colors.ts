import { PaletteIndex } from "../palette";
import { getBytes } from "./io";
import { ReadonlyDataView } from "./types";

export function readBgColors(dataView: ReadonlyDataView) {
	const bytes = getBytes(dataView);
	return {
		bgColorLight: bytes.map(
			(bgColorMetadata) => (bgColorMetadata & 0b1111) as PaletteIndex
		),
		bgColorDark: bytes.map(
			(bgColorMetadata) => ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex
		),
	};
}
