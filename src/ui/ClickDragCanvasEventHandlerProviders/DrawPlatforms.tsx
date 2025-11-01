import { useState } from "react";
import { bresenham, objectEntries } from "../../bb/functions";
import {
	getTiles,
	platformTilesSize,
	Tiles,
} from "../../bb/internal-data-formats/level";
import { Coord2, equal, floor, scale, subtract } from "../../math/coord2";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { assertTuple } from "../../bb/tuple";
import { levelSize } from "../../bb/game-definitions/level-size";
import { rectContainsPoint } from "../../math/rect";
import { holeRects } from "../../bb/game-definitions/holes";

const borderWidth = { x: 2, y: 1 };
const drawableTiles = {
	pos: borderWidth,
	size: subtract(levelSize, scale(borderWidth, 2)),
};
const holes = objectEntries(holeRects).flatMap(([row, holes]) =>
	objectEntries(holes).map(([side, hole]) => ({ row, side, hole }))
);

export const DrawPlatforms: ClickDragCanvasEventHandlerProvider = (props) => {
	const level = props.levels[props.levelIndex];
	const tiles = getTiles(level);
	const setTiles = (tiles: Tiles) =>
		props.setLevel({
			...level,
			tiles,
		});
	const toggleHole = (holePos: {
		row: "top" | "bottom";
		side: "left" | "right";
	}) =>
		props.setLevel({
			...level,
			holes: {
				...level.holes,
				[holePos.row]: {
					...level.holes[holePos.row],
					[holePos.side]: !level.holes[holePos.row][holePos.side],
				},
			},
		});

	const setSomeTiles = createSetSomeTiles(setTiles, tiles);
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
	let [lineStart, setLineStart] = useState<Coord2 | undefined>(undefined);

	return props.children({
		onClick: (eventCoord) => {
			const hole = holes.find((hole) =>
				rectContainsPoint(hole.hole, getTileCoord(eventCoord))
			);
			if (hole) {
				toggleHole(hole);
				return;
			}

			if (drawValue === undefined) {
				return;
			}
			setSomeTiles([getTileCoord(eventCoord)], drawValue);
		},
		onDragStart: (eventCoord) => {
			const tileCoord = getTileCoord(eventCoord);
			if (!rectContainsPoint(drawableTiles, tileCoord)) {
				return;
			}

			const newDrawValue = !tiles[tileCoord.y]![tileCoord.x]!;
			setDrawValue(newDrawValue);
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
			const tileCoord = getTileCoord(eventCoord);
			if (equal(lineStart, tileCoord)) {
				return;
			}
			if (!rectContainsPoint(drawableTiles, tileCoord)) {
				return;
			}
			setSomeTiles(bresenham(lineStart, tileCoord), drawValue);
			setLineStart(tileCoord);
		},
	});
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
			tiles.map((row) => assertTuple([...row], platformTilesSize.x)),
			platformTilesSize.y
		);

		for (const coord of coords) {
			newTiles[coord.y]![coord.x] = value;
		}

		setTiles(newTiles);
	};
}
