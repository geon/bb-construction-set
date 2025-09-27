import { ReactNode } from "react";
import { attempt, updateArrayAtIndex, zipObject } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import styled from "styled-components";
import { Tiles } from "../../bb/internal-data-formats/level";
import {
	imageDataFromImage,
	imageDataFromPaletteImage,
	imageDataToBlob,
	imageFromFile,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import {
	drawLevelsTiles,
	parseLevelsTiles,
} from "../../bb/palette-image/level";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";
import { TabBar } from "../TabBar";
import { PlatformEditor } from "./PlatformEditor";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

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
