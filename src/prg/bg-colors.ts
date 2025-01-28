import { Level } from "../level";
import { PaletteIndex } from "../palette";
import { dataViewSetBytes, getBytes } from "./io";
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

export function patchBgColors(bytes: DataView, levels: readonly Level[]) {
	dataViewSetBytes(
		bytes,
		levels.map((level) => level.bgColorLight + (level.bgColorDark << 4))
	);
}
