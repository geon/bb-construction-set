import { ReactNode } from "react";
import {
	levelsToPeFileData,
	peFileDataToLevels,
} from "../../bb/pe/level-pe-conversion";
import {
	deserializePeFileData,
	serializePeFileData,
} from "../../bb/pe/pe-file";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt, unzipObject, zipObject } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { drawLevelPlatformChars } from "../../bb/palette-image/char";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { FileInput } from "../FileInput";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";
import { assertTuple } from "../../bb/tuple";
import styled from "styled-components";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;
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
			<BlobDownloadButton
				getBlob={async () => {
					const parts = parsedPrg.levels.map((level, index) => {
						const blob = new Blob(
							[
								serializePeFileData(
									levelsToPeFileData({
										...parsedPrg,
										levels: [level],
										shadowChars: assertTuple(
											parsedPrg.chars.shadows.flat().flat(),
											6
										),
									})
								),
							],
							{ type: "application/json" }
						);

						const fileName = (index + 1).toString().padStart(3, "0") + ".pe";

						return { blob, fileName };
					});

					return {
						parts,
						fileName: "bubble bobble c64 - all levels.zip",
					};
				}}
				label="Download PETSCII Editor file"
			/>
			<FileInput
				accept={["pe"]}
				multiple
				onChange={async (files) => {
					const pes = await Promise.all(
						files.map((file) => file.arrayBuffer())
					);

					const parsedPeData =
						pes &&
						attempt(() => {
							const deserializedPeFileDatas = pes.map((buffer) =>
								deserializePeFileData(new TextDecoder("utf-8").decode(buffer))
							);
							const levels =
								deserializedPeFileDatas.flatMap(peFileDataToLevels);

							return {
								levels,
								deserializedPeFileDatas,
							};
						});

					if (parsedPeData?.type !== "ok") {
						alert(`Could not parse pe: ${parsedPeData?.error ?? "No reason."}`);
						return;
					}

					const old = unzipObject(parsedPrg.levels);
					const new_ = unzipObject(parsedPeData.result.levels);
					const levelsWithNewGraphics = zipObject({
						...old,
						bgColorLight: new_.bgColorLight,
						bgColorDark: new_.bgColorDark,
						platformChar: new_.platformChar,
						sidebarChars: new_.sidebarChars,
					});

					setParsedPrg({ ...parsedPrg, levels: levelsWithNewGraphics });
				}}
			>
				Choose files
			</FileInput>
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
