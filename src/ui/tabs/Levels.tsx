import { ReactNode, useState } from "react";
import { updateArrayAtIndex } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { assertTuple, Tuple } from "../../bb/tuple";
import styled from "styled-components";
import { Tiles } from "../../bb/internal-data-formats/level";
import { Coord2, scale, subtract } from "../../math/coord2";
import { levelWidth, levelHeight } from "../../bb/game-definitions/level-size";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

export function imageDataFromTiles(tiles: Tiles): ImageData {
	const size: Coord2 = {
		x: levelWidth,
		y: levelHeight,
	};

	const solidColor = [255, 255, 255, 255] as const;
	const emptyColor = [0, 0, 0, 0] as const;

	return new ImageData(
		new Uint8ClampedArray(
			tiles.flat().flatMap((solid): Tuple<number, 4> => {
				return solid ? solidColor : emptyColor;
			})
		),
		size.x,
		size.y
	);
}

function PlatformEditor(props: {
	readonly tiles: Tiles;
	readonly setTiles: (tiles: Tiles) => void;
}): JSX.Element {
	const setTile = createSetTile(props.setTiles, props.tiles);
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);

	return (
		<ImageDataCanvas
			style={{ width: "100%" }}
			imageData={imageDataFromTiles(props.tiles)}
			onMouseDown={(event) => {
				const tileCoord: Coord2 = getTileCoord(event);
				drawValue = !props.tiles[tileCoord.y]![tileCoord.x]!;
				setTile(tileCoord, drawValue);
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
				setTile(tileCoord, drawValue);
			}}
		/>
	);
}

function createSetTile(setTiles: (tiles: Tiles) => void, tiles: Tiles) {
	return (coord: Coord2, value: boolean) =>
		setTiles(
			assertTuple(
				updateArrayAtIndex(tiles, coord.y, (currentRow) =>
					assertTuple(
						updateArrayAtIndex(currentRow, coord.x, () => value),
						levelWidth
					)
				),
				levelHeight
			)
		);
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

export function Levels({
	parsedPrg,
	setParsedPrg,
	levelIndex,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
	readonly setLevelIndex: (index: number) => void;
}): ReactNode {
	const level = parsedPrg.levels[levelIndex]!;
	const setTiles = (tiles: Tiles) =>
		setParsedPrg({
			...parsedPrg,
			levels: updateArrayAtIndex(parsedPrg.levels, levelIndex, (level) => ({
				...level,
				tiles,
			})),
		});

	return (
		<Styling>
			<PlatformEditor tiles={level.tiles} setTiles={setTiles} />
		</Styling>
	);
}
