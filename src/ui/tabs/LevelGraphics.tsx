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
import { drawPlatformCharsToCanvas } from "../../bb/image-data/draw-levels-to-canvas";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { FileInput } from "../FileInput";

export function LevelGraphics({
	parsedPrg,
	setParsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={drawPlatformCharsToCanvas(parsedPrg.levels)}
			/>
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => {
					const parts = parsedPrg.levels.map((level, index) => {
						const blob = new Blob(
							[
								serializePeFileData(
									levelsToPeFileData({
										...parsedPrg,
										levels: [level],
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
						fileName: "bubble bobble c64 - all levels.pe",
					};
				}}
				label="Download PETSCII Editor file"
			/>
			<p>
				Save the file generated above, then edit it in the{" "}
				<a href="https://petscii.krissz.hu">PETSCII Editor web app</a>, save it
				and select it here.
			</p>
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
		</>
	);
}
