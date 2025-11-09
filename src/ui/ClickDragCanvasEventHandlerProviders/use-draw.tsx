import { useState } from "react";
import { bresenham } from "../../bb/functions";
import { Coord2, equal } from "../../math/coord2";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";

export function useDraw(
	setSomeTiles: (coords: readonly Coord2[], value: boolean) => void,
	transformCoord: (coord: Coord2) => Coord2,
	getDrawValue: (tileCoord: Coord2) => boolean
): ClickDragCanvasDragEventHandlers {
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
	let [lineStart, setLineStart] = useState<Coord2 | undefined>(undefined);

	return {
		onClick: (eventCoord) => {
			if (drawValue === undefined) {
				return;
			}
			setSomeTiles([transformCoord(eventCoord)], drawValue);
		},
		onDragStart: (eventCoord) => {
			const tileCoord = transformCoord(eventCoord);

			setDrawValue(getDrawValue(tileCoord));
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
			setSomeTiles(bresenham(lineStart, tileCoord), drawValue);
			setLineStart(tileCoord);
		},
	};
}
