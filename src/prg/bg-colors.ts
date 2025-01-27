import { PaletteIndex } from "../palette";
import { bgColorMetadataArrayAddress } from "./data-locations";
import { getBytes } from "./io";

export function readBgColors(getByte: (address: number) => number) {
	const bytes = getBytes(getByte, bgColorMetadataArrayAddress, 100);
	return {
		bgColorLight: bytes.map(
			(bgColorMetadata) => (bgColorMetadata & 0b1111) as PaletteIndex
		),
		bgColorDark: bytes.map(
			(bgColorMetadata) => ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex
		),
	};
}
