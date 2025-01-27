import { PaletteIndex } from "../palette";
import { GetBoundedByte, getBytes } from "./io";

export function readBgColors(getBgColorByte: GetBoundedByte) {
	const bytes = getBytes(getBgColorByte, 100);
	return {
		bgColorLight: bytes.map(
			(bgColorMetadata) => (bgColorMetadata & 0b1111) as PaletteIndex
		),
		bgColorDark: bytes.map(
			(bgColorMetadata) => ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex
		),
	};
}
