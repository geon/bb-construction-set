import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt, zipObject } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	drawPlatformChars,
	parsePlatformChars,
} from "../../bb/palette-image/char";
import { FileInput } from "../FileInput";
import {
	imageDataFromImage,
	imageDataFromPaletteImage,
	imageDataToBlob,
	imageFromFile,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import {
	doubleImageWidth,
	halfImageWidth,
} from "../../bb/palette-image/palette-image";
import styled from "styled-components";
import { mapTuple } from "../../bb/tuple";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;
`;

export const ImageButtons = styled.div`
	display: flex;
	flex-direction: row;
	gap: 1em;
`;

export function LevelGraphics(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
	readonly setLevelIndex: (index: number) => void;
}): ReactNode {
	return (
		<Styling>
			<ImageButtons>
				<FileInput
					accept={["image/*"]}
					onChange={async (file) => {
						const imageData = imageDataFromImage(await imageFromFile(file));

						const parsedTiles = attempt(() =>
							parsePlatformChars(
								halfImageWidth(paletteImageFromImageData(imageData))
							)
						);

						if (parsedTiles.type !== "ok") {
							alert(
								`Could not read image: ${parsedTiles.error ?? "No reason."}`
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
								})
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
								doubleImageWidth(drawPlatformChars(props.parsedPrg.levels))
							)
						),
					})}
					label={"Export Image"}
				/>
			</ImageButtons>
		</Styling>
	);
}
