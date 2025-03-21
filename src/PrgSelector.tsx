import { ReactNode } from "react";
import { levelsToPeFileData } from "./bb/level-pe-conversion";
import { serializePeFileData } from "./bb/pe-file";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { Levels } from "./Levels";
import { ParsePrgResult } from "./useParsePrg";
import { mapRecord } from "./bb/functions";

export function PrgSelector({
	parsedPrgData,
}: {
	readonly parsedPrgData: ParsePrgResult | undefined;
}): ReactNode {
	return (
		<>
			{parsedPrgData?.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData?.error ?? "No reason."}</p>
			) : (
				<>
					<Levels
						{...parsedPrgData}
						levels={parsedPrgData.result.levels}
						spriteColors={mapRecord(
							parsedPrgData.result.sprites,
							({ color }) => color
						)}
					/>
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
