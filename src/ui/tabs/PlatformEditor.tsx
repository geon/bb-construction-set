import { useState } from "react";
import { assertTuple } from "../../bb/tuple";
import { Level, Tiles } from "../../bb/internal-data-formats/level";
import { Coord2 } from "../../math/coord2";
import { levelSize } from "../../bb/game-definitions/level-size";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { drawLevelTiles } from "../../bb/palette-image/level";
import {
	ClickDragCanvas,
	ClickDragCanvasDragEventHandlers,
} from "../ClickDragCanvas";
import { bresenham } from "../../bb/functions";

export function PlatformEditor(props: {
	readonly level: Level;
	readonly setLevel: (level: Level) => void;
}): JSX.Element {
	const tiles = props.level.tiles;
	const setTiles = (tiles: Tiles) =>
		props.setLevel({
			...props.level,
			tiles,
		});

	const setSomeTiles = createSetSomeTiles(setTiles, tiles);
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
	let [lineStart, setLineStart] = useState<Coord2 | undefined>(undefined);

	const eventHandlers: ClickDragCanvasDragEventHandlers = {
		onClick: (tileCoord) => {
			if (drawValue === undefined) {
				return;
			}
			setSomeTiles([tileCoord], drawValue);
		},
		onDragStart: (tileCoord) => {
			const newDrawValue = !tiles[tileCoord.y]![tileCoord.x]!;
			setDrawValue(newDrawValue);
			setLineStart(tileCoord);
		},
		onDragEnd: () => {
			setDrawValue(undefined);
			setLineStart(undefined);
		},
		onDragUpdate: (tileCoord) => {
			if (drawValue === undefined) {
				return;
			}
			if (lineStart === undefined) {
				return;
			}
			setSomeTiles(bresenham(lineStart, tileCoord), drawValue);
			setLineStart(tileCoord);
		},
	};

	return (
		<ClickDragCanvas
			style={{ width: "100%" }}
			imageData={imageDataFromPaletteImage(drawLevelTiles(props.level.tiles))}
			{...eventHandlers}
		/>
	);
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
