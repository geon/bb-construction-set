import { ReactNode } from "react";
import { levelsToPeFileData } from "../bb/level-pe-conversion";
import { serializePeFileData } from "../bb/pe-file";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { attempt, mapRecord } from "../bb/functions";
import { parsePrg } from "../bb/parse-prg";
import {
	drawLevelsToCanvas,
	drawPlatformCharsToCanvas,
} from "../bb/draw-levels-to-canvas";
import { ImageDataCanvas } from "./ImageDataCanvas";

export function LevelsVisualizerWithPeDownload({
	prg,
}: {
	readonly prg: ArrayBuffer;
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
		</>
	);
}
