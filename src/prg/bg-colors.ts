import { PaletteIndex } from "../palette";
import { bgColorMetadataArrayAddress } from "./data-locations";

export function readBgColorsForLevel(
	getByte: (address: number) => number,
	levelIndex: number
) {
	const bgColorMetadata = getByte(bgColorMetadataArrayAddress + levelIndex);
	const bgColorLight = (bgColorMetadata & 0b1111) as PaletteIndex;
	const bgColorDark = ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex;
	return { bgColorLight, bgColorDark };
}
