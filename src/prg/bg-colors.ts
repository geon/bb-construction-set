import { PaletteIndex } from "../palette";
import { bgColorMetadataArrayAddress } from "./data-locations";
import { getBytes } from "./io";

export function readBgColors(getByte: (address: number) => number) {
	return getBytes(getByte, bgColorMetadataArrayAddress, 100).map(
		(bgColorMetadata) => {
			const bgColorLight = (bgColorMetadata & 0b1111) as PaletteIndex;
			const bgColorDark = ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex;
			return { bgColorLight, bgColorDark };
		}
	);
}
