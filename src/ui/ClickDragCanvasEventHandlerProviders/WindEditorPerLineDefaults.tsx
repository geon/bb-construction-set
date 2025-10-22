import { useState } from "react";
import { updateArrayAtIndex } from "../../bb/functions";
import {
	BubbleCurrentDirection,
	BubbleCurrentPerLineDefaults,
} from "../../bb/internal-data-formats/level";
import { Coord2, floor, scale, subtract } from "../../math/coord2";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";
import { Setter } from "../types";

export const WindEditorPerLineDefaults = (props: {
	readonly perLineDefaults: BubbleCurrentPerLineDefaults;
	readonly setPerLineDefaults: Setter<BubbleCurrentPerLineDefaults>;
	readonly children: (
		eventHandlers: ClickDragCanvasDragEventHandlers
	) => React.ReactNode;
}) => {
	const [lastCoord, setLeastCoord] = useState<Coord2 | undefined>(undefined);

	return props.children({
		onDragStart: setLeastCoord,
		onDragUpdate: (eventCoord) => {
			setLeastCoord(eventCoord);
			if (!lastCoord) {
				return;
			}

			const diff = subtract(eventCoord, lastCoord);
			const direction: BubbleCurrentDirection =
				Math.abs(diff.x) > Math.abs(diff.y)
					? diff.x > 0
						? 1
						: 3
					: diff.y > 0
					? 2
					: 0;

			const coord = getTileCoord(lastCoord);
			props.setPerLineDefaults(
				updateArrayAtIndex(props.perLineDefaults, coord.y, () => direction)
			);
		},
	});
};

function getTileCoord(eventCoord: Coord2) {
	return floor(scale(eventCoord, 1 / 8));
}
