import { PaletteIndex } from "../palette";
import { getBytes } from "./io";

export function readBgColors(dataView: DataView) {
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
