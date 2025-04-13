import { ReactNode } from "react";
import { levelsToPeFileData } from "../../bb/pe/level-pe-conversion";
import { serializePeFileData } from "../../bb/pe/pe-file";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt, mapRecord } from "../../bb/functions";
import { parsePrg } from "../../bb/prg/parse-prg";
import { drawLevelsToCanvas } from "../../bb/image-data/draw-levels-to-canvas";
import { ImageDataCanvas } from "../ImageDataCanvas";

export function Levels({
	prg,
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
						imageData={drawLevelsToCanvas(
							parsedPrgData.result.levels,
							mapRecord(parsedPrgData.result.sprites, ({ color }) => color)
						)}
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

			{/* <p>
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

					const patched = patchPrg(
						prg,
						parsedPeData.result.levels,
						new Set<LevelDataSegmentName>([
							"symmetry",
							"bitmaps",
							"holeMetadata",
							"monsters",
							"windCurrents",
						]),
						"retroForge"
					);
					setPrg(patched);
				}}
			>
				Choose files
			</FileInput> */}
		</>
	);
}
