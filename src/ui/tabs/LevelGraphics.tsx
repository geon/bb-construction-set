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
import { parsePrg, patchPrg } from "../../bb/prg/parse-prg";
import { drawPlatformCharsToCanvas } from "../../bb/image-data/draw-levels-to-canvas";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { FileInput } from "../FileInput";

export function LevelGraphics({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer) => void;
}): ReactNode {
	const parsedPrgData = attempt(() => parsePrg(prg));

	return (
		<>
			{parsedPrgData.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData.error ?? "No reason."}</p>
			) : (
				<>
					<ImageDataCanvas
						imageData={drawPlatformCharsToCanvas(parsedPrgData.result.levels)}
					/>
					<br />
					<br />
					<BlobDownloadButton
						getBlob={() => {
							const parts = parsedPrgData.result.levels.map((level, index) => {
								const blob = new Blob(
									[
										serializePeFileData(
											levelsToPeFileData({
												...parsedPrgData.result,
												levels: [level],
											})
										),
									],
									{ type: "application/json" }
								);

								const fileName =
									(index + 1).toString().padStart(3, "0") + ".pe";

								return { blob, fileName };
							});

							return {
								parts,
								fileName: "bubble bobble c64 - all levels.pe",
							};
						}}
						label="Download PETSCII Editor file"
					/>
				</>
			)}
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

					if (parsedPrgData.type !== "ok") {
						return;
					}

					const old = unzipObject(parsedPrgData.result.levels);
					const new_ = unzipObject(parsedPeData.result.levels);
					const levelsWithNewGraphics = zipObject({
						...old,
						bgColorLight: new_.bgColorLight,
						bgColorDark: new_.bgColorDark,
						platformChar: new_.platformChar,
						sidebarChars: new_.sidebarChars,
					});

					const patched = patchPrg(prg, levelsWithNewGraphics, "retroForge");
					setPrg(patched);
				}}
			>
				Choose files
			</FileInput>
		</>
	);
}
