import { ReactNode } from "react";
import { levelsToPeFileData } from "./bb/level-pe-conversion";
import { serializePeFileData } from "./bb/pe-file";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { Levels } from "./Levels";
import { attempt, mapRecord } from "./bb/functions";
import { parsePrg } from "./bb/parse-prg";

export function PrgSelector({ prg }: { readonly prg: ArrayBuffer }): ReactNode {
	const parsedPrgData = attempt(() => parsePrg(prg));

	return (
		<>
			<h2>Current prg-file levels</h2>
			{parsedPrgData.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData.error ?? "No reason."}</p>
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
