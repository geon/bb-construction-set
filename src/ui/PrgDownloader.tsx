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
import { ButtonRow } from "./ButtonRow";
import { icons } from "./icons";

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
	grid-template-rows: 1fr min-content;
	grid-template-columns: repeat(10, auto);

	canvas {
		width: 100%;
	}
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
	readonly levelIndex: number | undefined;
	readonly setLevelIndex: React.Dispatch<
		React.SetStateAction<number | undefined>
	>;
}): ReactNode {
	return (
		<ImageCard>
			<LevelPreview>
				{levelIndex !== undefined ? (
					<ImageDataCanvas
						style={{ width: "100%" }}
						imageData={imageDataFromPaletteImage(
							doubleImageWidth(drawLevel(levelIndex, parsedPrg))
						)}
					/>
				) : (
					<LevelSelector parsedPrg={parsedPrg} setLevelIndex={setLevelIndex} />
				)}
			</LevelPreview>
			<div>
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
					<button
						onClick={() =>
							levelIndex !== undefined && setLevelIndex(levelIndex - 1)
						}
						disabled={!(levelIndex !== undefined && levelIndex > 0)}
					>
						{icons.chevrons.left}
					</button>
					<button
						onClick={() => setLevelIndex(undefined)}
						disabled={levelIndex === undefined}
					>
						{icons.grid}
					</button>
					<button
						onClick={() =>
							levelIndex !== undefined && setLevelIndex(levelIndex + 1)
						}
						disabled={!(levelIndex !== undefined && levelIndex < 99)}
					>
						{icons.chevrons.right}
					</button>
				</ButtonRow>
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
			</div>
		</ImageCard>
	);
}
