import { useState } from "react";
import { bresenham } from "../bb/functions";
import { Level, Tiles } from "../bb/internal-data-formats/level";
import { Coord2, floor, multiply, scale } from "../math/coord2";
import { ClickDragCanvasDragEventHandlers } from "./ClickDragCanvas";
import { Setter } from "./types";
import { levelSize } from "../bb/game-definitions/level-size";
import { assertTuple } from "../bb/tuple";

export type ClickDragCanvasEventHandlerProvider = (props: {
	level: Level;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers
	) => React.ReactNode;
}) => React.ReactNode;

export const clickDragCanvasEventHandlerProviders = {
	"draw-platforms": (props) => {
		const tiles = props.level.tiles;
		const setTiles = (tiles: Tiles) =>
			props.setLevel({
				...props.level,
				tiles,
			});

		const setSomeTiles = createSetSomeTiles(setTiles, tiles);
		let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
		let [lineStart, setLineStart] = useState<Coord2 | undefined>(undefined);

		return props.children({
			onClick: (eventCoord) => {
				if (drawValue === undefined) {
					return;
				}
				setSomeTiles([getTileCoord(eventCoord)], drawValue);
			},
			onDragStart: (eventCoord) => {
				const tileCoord = getTileCoord(eventCoord);
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
				setSomeTiles(bresenham(lineStart, tileCoord), drawValue);
				setLineStart(tileCoord);
			},
		});
	},
} as const satisfies Record<string, ClickDragCanvasEventHandlerProvider>;

function getTileCoord(eventCoord: Coord2): Coord2 {
	return floor(multiply(eventCoord, { x: 1 / 4, y: 1 / 8 }));
}

function createSetSomeTiles(setTiles: (tiles: Tiles) => void, tiles: Tiles) {
	return (coords: readonly Coord2[], value: boolean) => {
		const newTiles = assertTuple(
			tiles.map((row) => assertTuple([...row], levelSize.x)),
			levelSize.y
		);

		for (const coord of coords) {
			newTiles[coord.y]![coord.x] = value;
		}

		setTiles(newTiles);
	};
}
