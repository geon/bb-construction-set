import { ReactNode } from "react";
import { levelsToPeFileData } from "./bb/level-pe-conversion";
import { serializePeFileData } from "./bb/pe-file";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { LevelsViewer } from "./LevelsViewer";
import { attempt, mapRecord } from "./bb/functions";
import { parsePrg } from "./bb/parse-prg";
import { LevelCharsViewer } from "./LevelCharsViewer";

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
					<LevelsViewer
						levels={parsedPrgData.result.levels}
						spriteColors={mapRecord(
							parsedPrgData.result.sprites,
							({ color }) => color
						)}
					/>
					<LevelCharsViewer levels={parsedPrgData.result.levels} />
					<br />
					<br />
					<BlobDownloadButton
						getBlob={() =>
							new Blob(
								[serializePeFileData(levelsToPeFileData(parsedPrgData.result))],
								{
									type: "application/json",
								}
							)
						}
						label="Download PETSCII Editor file"
						fileName="bubble bobble c64 - all levels.pe"
					/>
				</>
			)}
		</>
	);
}
