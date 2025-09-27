import { ReactNode } from "react";
import { attempt, zipObject } from "../../bb/functions";
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
import { ImageDataCanvas } from "../ImageDataCanvas";
import { ImageButtons } from "./Levels";

export function Platforms({
	setParsedPrg,
	parsedPrg,
}: {
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly parsedPrg: ParsedPrg;
}): ReactNode | readonly ReactNode[] {
	const levelsTilesImageData = imageDataFromPaletteImage(
		drawLevelsTiles(parsedPrg.levels.map((level) => level.tiles))
	);

	return (
		<>
			<ImageDataCanvas
				style={{ width: "100%" }}
				imageData={levelsTilesImageData}
			/>
			<ImageButtons>
				<FileInput
					accept={["image/*"]}
					onChange={async (file) => {
						const imageData = imageDataFromImage(await imageFromFile(file));

						const parsedTiles = attempt(() =>
							parseLevelsTiles(paletteImageFromImageData(imageData))
						);

						if (parsedTiles.type !== "ok") {
							alert(
								`Could not read image: ${parsedTiles.error ?? "No reason."}`
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
	);
}
