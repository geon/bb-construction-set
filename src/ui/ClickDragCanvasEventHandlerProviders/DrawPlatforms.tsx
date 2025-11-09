import { useState } from "react";
import { bresenham, objectEntries, range } from "../../bb/functions";
import { Coord2, equal, floor, scale } from "../../math/coord2";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { assertTuple } from "../../bb/tuple";
import { levelSize } from "../../bb/game-definitions/level-size";
import { rectContainsPoint } from "../../math/rect";
import { holeRects } from "../../bb/game-definitions/holes";
import {
	getPlatformTilesAndHoles,
	getTiles,
	Tiles,
} from "../../bb/internal-data-formats/tiles";
import { ClickDragCanvasDragEventHandlers } from "/Users/vicwid/code/geon/bb-construction-set/src/ui/ClickDragCanvas";

const holes = objectEntries(holeRects).flatMap(([row, holes]) =>
	objectEntries(holes).map(([side, hole]) => ({ row, side, hole }))
);

export const DrawPlatforms: ClickDragCanvasEventHandlerProvider = (props) => {
	const level = props.levels[props.levelIndex];
	const tiles = getTiles(level);
	const setTiles = (tiles: Tiles) =>
		props.setLevel({
			...level,
			...getPlatformTilesAndHoles(tiles),
		});

	const setSomeTiles = createSetSomeTiles(setTiles, tiles);

	function getDrawValue(tileCoord: Coord2) {
		return !tiles[tileCoord.y]![tileCoord.x]!;
	}

	const transformCoord = getTileCoord;
	return props.children(useDraw(setSomeTiles, transformCoord, getDrawValue));
};

function useDraw(
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

export function getTileCoord(eventCoord: Coord2): Coord2 {
	return floor(scale(eventCoord, 1 / 8));
}

export function createSetSomeTiles(
	setTiles: (tiles: Tiles) => void,
	tiles: Tiles
) {
	return (coords: readonly Coord2[], value: boolean) => {
		const newTiles = assertTuple(
			tiles.map((row) => assertTuple([...row], levelSize.x)),
			levelSize.y
		);

		for (const coord of coords) {
			newTiles[coord.y]![coord.x] = value;
		}

		// If the hole is touched at all, change all of it.
		for (const hole of holes) {
			if (coords.some((coord) => rectContainsPoint(hole.hole, coord))) {
				const pos = hole.hole.pos;
				// Changing only the leftmost tile would be enough for `getPlatformTilesAndHoles`,
				// but that's leaky abstraction.
				for (const x of range(hole.hole.size.x)) {
					newTiles[pos.y]![pos.x + x] = value;
				}
			}
		}

		setTiles(newTiles);
	};
}
