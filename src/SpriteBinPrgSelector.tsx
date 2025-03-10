import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { FileInput } from "./FileInput";
import { SpriteBinParsePrgResult } from "./useSpriteBinParsePrg";

export function SpriteBinPrgSelector({
	parsedPrgData,
	setPrg,
}: {
	readonly parsedPrgData: SpriteBinParsePrgResult | undefined;
	readonly setPrg: (file: File | undefined) => Promise<void>;
}): ReactNode {
	return (
		<>
			<h2>Select a prg-file</h2>
			<p>
				Select an <i>unpacked</i> c64 .prg-file containing Bubble Bobble. Most
				.prg files you find will be <i>packed</i> and the c64 unpacks them on
				startup.
			</p>
			<FileInput accept={["prg"]} onChange={setPrg}>
				Choose file
			</FileInput>
			{!parsedPrgData ? (
				<p>No prg selected.</p>
			) : parsedPrgData?.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData?.error ?? "No reason."}</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() =>
							new Blob([parsedPrgData.result.spriteBin], {
								type: "application/json",
							})
						}
						label="Download SpritePad bin-file."
						fileName="bubble bobble c64 - all sprites.bin"
					/>
				</>
			)}
		</>
	);
}
