import { useState } from "react";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { assertTuple } from "../../bb/tuple";
import { Tiles } from "../../bb/internal-data-formats/level";
import { Coord2, scale, subtract } from "../../math/coord2";
import { levelWidth, levelSize } from "../../bb/game-definitions/level-size";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { drawLevelTiles } from "../../bb/palette-image/level";

export function PlatformEditor(props: {
	readonly tiles: Tiles;
	readonly setTiles: (tiles: Tiles) => void;
}): JSX.Element {
	const setSomeTiles = createSetSomeTiles(props.setTiles, props.tiles);
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);

	return (
		<ImageDataCanvas
			style={{ width: "100%" }}
			imageData={imageDataFromPaletteImage(drawLevelTiles(props.tiles))}
			onMouseDown={(event) => {
				const tileCoord: Coord2 = getTileCoord(event);
				drawValue = !props.tiles[tileCoord.y]![tileCoord.x]!;
				setSomeTiles([tileCoord], drawValue);
				setDrawValue(drawValue);
			}}
			onMouseUp={() => {
				setDrawValue(undefined);
			}}
			onMouseMove={(event) => {
				if (drawValue === undefined) {
					return;
				}
				const tileCoord: Coord2 = getTileCoord(event);
				setSomeTiles([tileCoord], drawValue);
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

function getTileCoord(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
	const page: Coord2 = { x: event.clientX, y: event.clientY };
	const rect = event.currentTarget.getBoundingClientRect();
	const elementLocation: Coord2 = rect;
	const scaleFactor = rect.width / levelWidth;
	const clickCoord = scale(subtract(page, elementLocation), 1 / scaleFactor);
	const tileCoord: Coord2 = {
		x: Math.floor(clickCoord.x),
		y: Math.floor(clickCoord.y),
	};
	return tileCoord;
}
