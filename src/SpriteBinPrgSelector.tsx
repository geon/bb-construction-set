import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { SpriteBinParsePrgResult } from "./useSpriteBinParsePrg";

export function SpriteBinPrgSelector({
	parsedPrgData,
}: {
	readonly parsedPrgData: SpriteBinParsePrgResult | undefined;
}): ReactNode {
	return (
		<>
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
