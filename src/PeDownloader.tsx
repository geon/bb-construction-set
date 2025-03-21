import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { ParsePeResult } from "./useParsePe";
import { serializePeFileData } from "./bb/pe-file";
import {
	getSpriteColorsFromPeFileData,
	levelsToPeScreensAndCharsets,
} from "./bb/level-pe-conversion";

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
											getSpriteColorsFromPeFileData(
												parsedPeData.result.deserializedPeFileDatas[0]!
											),
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
