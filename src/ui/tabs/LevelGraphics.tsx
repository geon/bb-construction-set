import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt, zipObject } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	drawLevelPlatformChars,
	drawPlatformChars,
	parsePlatformChars,
} from "../../bb/palette-image/char";
import { ImageDataCanvas } from "../ImageDataCanvas";
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

export function LevelGraphics({
	parsedPrg,
	setParsedPrg,
	levelIndex,
	setLevelIndex,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
	readonly setLevelIndex: (index: number) => void;
}): ReactNode {
	return (
		<Styling>
			<LevelSelector
				parsedPrg={parsedPrg}
				levelIndex={levelIndex}
				setLevelIndex={setLevelIndex}
			/>
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

						setParsedPrg({
							...parsedPrg,
							levels: zipObject({
								level: parsedPrg.levels,
								platformCharsData: parsedTiles.result,
							}).map(({ level, platformCharsData }) => ({
								...level,
								...platformCharsData,
							})),
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
								doubleImageWidth(drawPlatformChars(parsedPrg.levels))
							)
						),
					})}
					label={"Export Image"}
				/>
			</ImageButtons>
		</Styling>
	);
}

const LevelSelector = styled(
	(props: {
		readonly parsedPrg: ParsedPrg;
		readonly levelIndex: number;
		readonly setLevelIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{props.parsedPrg.levels.map((level, levelIndex) => (
					<ImageDataCanvas
						key={levelIndex}
						className={levelIndex === props.levelIndex ? "active" : undefined}
						imageData={imageDataFromPaletteImage(
							doubleImageWidth(drawLevelPlatformChars(level))
						)}
						onClick={() => props.setLevelIndex(levelIndex)}
						style={{ cursor: "pointer" }}
					/>
				))}
			</nav>
		);
	}
)`
	display: grid;
	grid-template-columns: repeat(10, auto);
	grid-column-gap: 8px;
	grid-row-gap: 8px;
	justify-items: center;
	justify-content: center;

	> .active {
		box-shadow: 0 0 0 2px black, 0 0 0 3px white;
		@media (prefers-color-scheme: light) {
			box-shadow: 0 0 0 2px white, 0 0 0 3px black;
		}
	}
`;
