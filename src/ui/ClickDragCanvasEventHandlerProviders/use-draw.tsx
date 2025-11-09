import { useState } from "react";
import { bresenham } from "../../bb/functions";
import { Coord2, equal } from "../../math/coord2";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";

export function useDraw(
	setValues: (coords: readonly Coord2[], value: boolean) => void,
	transformCoord: (coord: Coord2) => Coord2,
	getValue: (tileCoord: Coord2) => boolean
): ClickDragCanvasDragEventHandlers {
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
	let [lineStart, setLineStart] = useState<Coord2 | undefined>(undefined);

	return {
		onClick: (eventCoord) => {
			if (drawValue === undefined) {
				return;
			}
			setValues([transformCoord(eventCoord)], drawValue);
		},
		onDragStart: (eventCoord) => {
			const tileCoord = transformCoord(eventCoord);

			setDrawValue(getValue(tileCoord));
			setLineStart(tileCoord);
		},
		onDragEnd: () => {
			setDrawValue(undefined);
			setLineStart(undefined);
		},
		onDragUpdate: (eventCoord) => {
			if (drawValue === undefined) {
				return;
			}
			if (lineStart === undefined) {
				return;
			}
			const tileCoord = transformCoord(eventCoord);
			if (equal(lineStart, tileCoord)) {
				return;
			}
			setValues(bresenham(lineStart, tileCoord), drawValue);
			setLineStart(tileCoord);
		},
	};
}
