import { zipObject } from "../functions";
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

export function patchBgColors(
	bytes: DataView,
	bgColorLight: readonly PaletteIndex[],
	bgColorDark: readonly PaletteIndex[]
) {
	dataViewSetBytes(
		bytes,
		zipObject({ bgColorLight, bgColorDark }).map(
			({ bgColorLight, bgColorDark }) => bgColorLight + (bgColorDark << 4)
		)
	);
}
