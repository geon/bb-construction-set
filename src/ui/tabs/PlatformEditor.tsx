import { useState } from "react";
import { assertTuple } from "../../bb/tuple";
import { Tiles } from "../../bb/internal-data-formats/level";
import { Coord2 } from "../../math/coord2";
import { levelSize } from "../../bb/game-definitions/level-size";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { drawLevelTiles } from "../../bb/palette-image/level";
import { ClickDragCanvas } from "../ClickDragCanvas";

export function PlatformEditor(props: {
	readonly tiles: Tiles;
	readonly setTiles: (tiles: Tiles) => void;
}): JSX.Element {
	const setSomeTiles = createSetSomeTiles(props.setTiles, props.tiles);
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
	let [dragStart, setDragStart] = useState<Coord2 | undefined>(undefined);

	return (
		<ClickDragCanvas
			style={{ width: "100%" }}
			imageData={imageDataFromPaletteImage(drawLevelTiles(props.tiles))}
			onClick={(tileCoord) => {
				if (drawValue === undefined) {
					return;
				}
				setSomeTiles([tileCoord], drawValue);
			}}
			onDragStart={(tileCoord) => {
				const newDrawValue = !props.tiles[tileCoord.y]![tileCoord.x]!;
				setDrawValue(newDrawValue);
				setDragStart(tileCoord);
			}}
			onDragEnd={() => {
				setDrawValue(undefined);
				setDragStart(undefined);
			}}
			onDragUpdate={(tileCoord) => {
				if (drawValue === undefined) {
					return;
				}
				const coords = [tileCoord];
				if (dragStart) {
					coords.push(dragStart);
					setDragStart(undefined);
				}
				setSomeTiles(coords, drawValue);
			}}
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
