import { ReactNode, useState } from "react";
import { attempt, updateArrayAtIndex, zipObject } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { assertTuple } from "../../bb/tuple";
import styled from "styled-components";
import { Tiles } from "../../bb/internal-data-formats/level";
import { Coord2, scale, subtract } from "../../math/coord2";
import { levelWidth, levelHeight } from "../../bb/game-definitions/level-size";
import {
	imageDataFromImage,
	imageDataFromPaletteImage,
	imageDataToBlob,
	imageFromFile,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import {
	drawLevelsTiles,
	drawLevelTiles,
	parseLevelsTiles,
} from "../../bb/palette-image/level";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";
import { TabBar } from "../TabBar";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

function PlatformEditor(props: {
	readonly tiles: Tiles;
	readonly setTiles: (tiles: Tiles) => void;
}): JSX.Element {
	const setTile = createSetTile(props.setTiles, props.tiles);
	let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);

	return (
		<ImageDataCanvas
			style={{ width: "100%" }}
			imageData={imageDataFromPaletteImage(drawLevelTiles(props.tiles))}
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

const ImageButtons = styled.div`
	display: flex;
	flex-direction: row;
	gap: 1em;
`;

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

	const levelsTilesImageData = imageDataFromPaletteImage(
		drawLevelsTiles(parsedPrg.levels.map((level) => level.tiles))
	);

	return (
		<Styling>
			<TabBar
				initialTabId={"tiles"}
				tabs={{
					tiles: {
						title: "Platforms",
						render: () => (
							<>
								<ImageDataCanvas
									style={{ width: "100%" }}
									imageData={levelsTilesImageData}
								/>
								<ImageButtons>
									<FileInput
										accept={["image/*"]}
										onChange={async (file) => {
											const imageData = imageDataFromImage(
												await imageFromFile(file)
											);

											const parsedTiles = attempt(() =>
												parseLevelsTiles(paletteImageFromImageData(imageData))
											);

											if (parsedTiles.type !== "ok") {
												alert(
													`Could not read image: ${
														parsedTiles.error ?? "No reason."
													}`
												);
												return;
											}

											setParsedPrg({
												...parsedPrg,
												levels: zipObject({
													level: parsedPrg.levels,
													tiles: parsedTiles.result,
												}).map(({ level, tiles }) => ({ ...level, tiles })),
											});
										}}
									>
										Import Image
									</FileInput>
									<BlobDownloadButton
										getBlob={async () => ({
											fileName: "platforms.png",
											blob: await imageDataToBlob(levelsTilesImageData),
										})}
										label={"Export Image"}
									/>
								</ImageButtons>
							</>
						),
					},
					quickDoodle: {
						title: "Quick Doodle",
						render: () => (
							<PlatformEditor tiles={level.tiles} setTiles={setTiles} />
						),
					},
				}}
			/>
		</Styling>
	);
}
