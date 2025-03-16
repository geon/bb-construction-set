import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { ParsePeResult } from "./useParsePe";
import { serializePeFileData } from "./bb/pe-file";
import { levelsToPeScreensAndCharsets } from "./bb/level-pe-conversion";
import { spriteColors } from "./bb/sprite";

export function PeDownloader({
	parsedPeData,
}: {
	readonly parsedPeData: ParsePeResult | undefined;
}): ReactNode {
	return (
		<>
			<h2>Download pe-file</h2>
			{!parsedPeData ? (
				<p>No pe selected.</p>
			) : parsedPeData?.type !== "ok" ? (
				<p>Could not parse pe: {parsedPeData?.error ?? "No reason."}</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() =>
							new Blob(
								[
									serializePeFileData({
										...parsedPeData.result.deserializedPeFileDatas[0]!,
										...levelsToPeScreensAndCharsets(
											parsedPeData.result.levels,
											// TODO: Not really. Use the data from the file.
											spriteColors,
											"retroForge"
										),
									}),
								],
								{
									type: "application/json",
								}
							)
						}
						label="Download PETSCII Editor file"
						fileName={"reformatted " + parsedPeData.fileName}
					/>
				</>
			)}
		</>
	);
}
