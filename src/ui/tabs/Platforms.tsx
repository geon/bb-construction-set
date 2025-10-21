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
import styled from "styled-components";
import { assertTuple, mapTuple } from "../../bb/tuple";

const ImageButtons = styled.div`
	display: flex;
	flex-direction: row;
	gap: 1em;
`;

export function Platforms(props: {
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly parsedPrg: ParsedPrg;
}): ReactNode | readonly ReactNode[] {
	return (
		<ImageButtons>
			<FileInput
				accept={["image/*"]}
				onChange={async (file) => {
					const imageData = imageDataFromImage(await imageFromFile(file));

					const parsedTiles = attempt(() =>
						parseLevelsTiles(paletteImageFromImageData(imageData))
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
								tiles: parsedTiles.result,
							}),
							({ level, tiles }) => ({ ...level, tiles })
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
								assertTuple(
									props.parsedPrg.levels.map((level) => level.tiles),
									100
								)
							)
						)
					),
				})}
				label={"Export Image"}
			/>
		</ImageButtons>
	);
}
