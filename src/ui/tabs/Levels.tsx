import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { LevelIndex } from "../../bb/internal-data-formats/levels";
import { attempt, zipObject, unzipObject } from "../../bb/functions";
import {
	imageDataFromImage,
	imageFromFile,
	paletteImageFromImageData,
	imageDataToBlob,
	imageDataFromPaletteImage,
} from "../../bb/image-data/image-data";
import {
	getPlatformTilesAndHoles,
	getTiles,
} from "../../bb/internal-data-formats/tiles";
import {
	parsePlatformChars,
	drawPlatformChars,
} from "../../bb/palette-image/char";
import {
	parseLevelsTiles,
	drawLevelsTiles,
} from "../../bb/palette-image/level";
import {
	halfImageWidth,
	doubleImageWidth,
} from "../../bb/palette-image/palette-image";
import { mapTuple, assertTuple } from "../../bb/tuple";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";
import { ButtonGroup } from "../ButtonGroup";
import { ButtonRow } from "../ButtonRow";
import { Flex } from "../Flex";
import { Level } from "../../bb/internal-data-formats/level";

export function Levels(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: LevelIndex;
	readonly setLevelIndex: (index: LevelIndex) => void;
}): ReactNode {
	return (
		<Flex $col>
			<ButtonRow $align="left">
				<span>Platforms:</span>
				<ButtonGroup>
					<FileInput
						accept={["image/*"]}
						onChange={async (file) => {
							const imageData = imageDataFromImage(await imageFromFile(file));

							const parsedTiles = attempt(() =>
								mapTuple(
									parseLevelsTiles(paletteImageFromImageData(imageData)),
									getPlatformTilesAndHoles,
								),
							);
							if (parsedTiles.type !== "ok") {
								alert(
									`Could not read image: ${parsedTiles.error ?? "No reason."}`,
								);
								return;
							}

							props.setParsedPrg({
								...props.parsedPrg,
								levels: mapTuple(
									zipObject({
										level: props.parsedPrg.levels,
										...unzipObject(parsedTiles.result),
									}),
									({ level, platformTiles, holes }): Level => ({
										...level,
										platformTiles,
										holes,
									}),
								),
							});
						}}
					>
						Import Image
					</FileInput>
					<BlobDownloadButton
						getBlob={async () => ({
							fileName: "platforms.png",
							blob: await imageDataToBlob(
								imageDataFromPaletteImage(
									drawLevelsTiles(
										assertTuple(props.parsedPrg.levels.map(getTiles), 100),
									),
								),
							),
						})}
					>
						Export Image
					</BlobDownloadButton>
				</ButtonGroup>
			</ButtonRow>
			<ButtonRow $align="left">
				<span>Level Graphics:</span>
				<ButtonGroup>
					<FileInput
						accept={["image/*"]}
						onChange={async (file) => {
							const imageData = imageDataFromImage(await imageFromFile(file));

							const parsedTiles = attempt(() =>
								parsePlatformChars(
									halfImageWidth(paletteImageFromImageData(imageData)),
								),
							);

							if (parsedTiles.type !== "ok") {
								alert(
									`Could not read image: ${parsedTiles.error ?? "No reason."}`,
								);
								return;
							}

							props.setParsedPrg({
								...props.parsedPrg,
								levels: mapTuple(
									zipObject({
										level: props.parsedPrg.levels,
										platformCharsData: parsedTiles.result,
									}),
									({ level, platformCharsData }) => ({
										...level,
										...platformCharsData,
									}),
								),
							});
						}}
					>
						Import Image
					</FileInput>
					<BlobDownloadButton
						getBlob={async () => ({
							fileName: "level graphics.png",
							blob: await imageDataToBlob(
								imageDataFromPaletteImage(
									doubleImageWidth(drawPlatformChars(props.parsedPrg.levels)),
								),
							),
						})}
					>
						Export Image
					</BlobDownloadButton>
				</ButtonGroup>
			</ButtonRow>
		</Flex>
	);
}
