import { ReactNode } from "react";
import { attempt, unzipObject, zipObject } from "../../bb/functions";
import {
	imageDataFromPaletteImage,
	imageDataFromImage,
	imageFromFile,
	paletteImageFromImageData,
	imageDataToBlob,
} from "../../bb/image-data/image-data";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	drawLevelsTiles,
	parseLevelsTiles,
} from "../../bb/palette-image/level";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";
import { assertTuple, mapTuple } from "../../bb/tuple";
import {
	getPlatformTilesAndHoles,
	getTiles,
} from "../../bb/internal-data-formats/tiles";
import { ButtonGroup } from "../ButtonGroup";

export function Platforms(props: {
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly parsedPrg: ParsedPrg;
}): ReactNode | readonly ReactNode[] {
	return (
		<ButtonGroup>
			<FileInput
				accept={["image/*"]}
				onChange={async (file) => {
					const imageData = imageDataFromImage(await imageFromFile(file));

					const parsedTiles = attempt(() =>
						mapTuple(
							parseLevelsTiles(paletteImageFromImageData(imageData)),
							getPlatformTilesAndHoles
						)
					);
					if (parsedTiles.type !== "ok") {
						alert(`Could not read image: ${parsedTiles.error ?? "No reason."}`);
						return;
					}

					props.setParsedPrg({
						...props.parsedPrg,
						levels: mapTuple(
							zipObject({
								level: props.parsedPrg.levels,
								...unzipObject(parsedTiles.result),
							}),
							({ level, platformTiles: tiles, holes }) => ({
								...level,
								tiles,
								holes,
							})
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
								assertTuple(props.parsedPrg.levels.map(getTiles), 100)
							)
						)
					),
				})}
			>
				Export Image
			</BlobDownloadButton>
		</ButtonGroup>
	);
}
