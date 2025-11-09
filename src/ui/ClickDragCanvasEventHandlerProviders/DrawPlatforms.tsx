import { objectEntries, range } from "../../bb/functions";
import { Coord2, floor, scale } from "../../math/coord2";
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
import { useDraw } from "./use-draw";

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
	return props.children(useDraw(getDrawValue, setSomeTiles, transformCoord));
};

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
