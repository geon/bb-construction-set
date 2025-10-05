import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { patchPrg } from "../bb/prg/parse-prg";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import {
	imageDataFromPaletteImage,
	imageDataToBlob,
} from "../bb/image-data/image-data";
import { drawLevel } from "../bb/palette-image/level";
import { doubleImageWidth } from "../bb/palette-image/palette-image";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { assertTuple } from "../bb/tuple";
import { Card } from "./Card";
import styled from "styled-components";
import { drawLevelThumbnail } from "../bb/image-data/draw-level";
import { mapAsync, mapRecord, range } from "../bb/functions";
import { Patch } from "../bb/prg/io";

const ImageCard = styled(Card)<{
	readonly children: [JSX.Element, JSX.Element];
}>`
	padding: 0;
	overflow: hidden;

	display: flex;
	flex-direction: column;

	> :first-child {
		width: 100%;
	}

	> :last-child {
		padding: 1em;
	}
`;

const LevelSelector = styled(
	(props: {
		readonly parsedPrg: ParsedPrg;
		readonly levelIndex: number;
		readonly setLevelIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		const shadowChars = assertTuple(
			props.parsedPrg.chars.shadows.flat().flat(),
			6
		);
		const spriteColors = mapRecord(
			props.parsedPrg.sprites,
			({ color }) => color
		);

		return (
			<nav className={props.className}>
				{props.parsedPrg.levels.map((level, levelIndex) => (
					<ImageDataCanvas
						key={levelIndex}
						className={levelIndex === props.levelIndex ? "active" : undefined}
						imageData={drawLevelThumbnail(level, spriteColors, shadowChars)}
						onClick={() => props.setLevelIndex(levelIndex)}
						style={{ cursor: "pointer" }}
					/>
				))}
			</nav>
		);
	}
)`
	display: grid;
	grid-template-columns: repeat(20, auto);
	grid-column-gap: 0px;
	grid-row-gap: 0px;
	justify-items: center;
	justify-content: center;

	> * {
		// Cut one pixel from each side.
		width: 30px;
		height: 25px;
		object-fit: cover;

		opacity: 30%;
		&.active {
			opacity: 100%;
		}
	}
`;

const ButtonRow = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 1em;
`;

const LevelPreview = styled.div`
	display: flex;
	flex-direction: column;
`;

export function PrgDownloader({
	parsedPrg,
	prg,
	manualPatch,
	levelIndex,
	setLevelIndex,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly prg: ArrayBuffer;
	readonly manualPatch: Patch;
	readonly levelIndex: number;
	readonly setLevelIndex: React.Dispatch<React.SetStateAction<number>>;
}): ReactNode {
	return (
		<ImageCard>
			<LevelPreview>
				<ImageDataCanvas
					style={{ width: "100%" }}
					imageData={imageDataFromPaletteImage(
						doubleImageWidth(drawLevel(levelIndex, parsedPrg))
					)}
				/>
				<LevelSelector
					parsedPrg={parsedPrg}
					levelIndex={levelIndex}
					setLevelIndex={setLevelIndex}
				/>
			</LevelPreview>
			{/* <h2>Save your prg-file</h2> */}
			{/* <p>
				Use the tools below to view and patch your prg-file. When you are done,
				you can download the prg-file. You can also resume editing your saved
				prg-file later.
				</p>
				<p>
				Before running your custom prg-file, it needs to be compressed with a
				tool like{" "}
				<a href="https://bitbucket.org/magli143/exomizer/wiki/downloads/exomizer-3.1.2.zip">
				Exomizer
				</a>
				. Drag an unpacked prg onto this{" "}
				<a href={new URL("/pack.bat", import.meta.url).href} download>
				.bat-file
				</a>
				, placed in the same folder as Exomizer to pack it for execution.
				</p> */}

			<ButtonRow>
				<BlobDownloadButton
					getBlob={async () => ({
						parts: await mapAsync(range(100), async (index) => ({
							fileName: (index + 1).toString().padStart(3, "0") + ".png",
							blob: await imageDataToBlob(
								imageDataFromPaletteImage(
									doubleImageWidth(drawLevel(index, parsedPrg))
								)
							),
						})),
						fileName: "bubble bobble c64 - all level images.zip",
					})}
					label="Save level images"
				/>
				<BlobDownloadButton
					getBlob={async () => {
						const patched = patchPrg(prg, parsedPrg, manualPatch);

						return {
							blob: new Blob([patched], {
								type: "application/octet-stream",
							}),
							fileName: "custom bubble bobble.prg",
						};
					}}
					label="Save"
				/>
			</ButtonRow>
		</ImageCard>
	);
}
