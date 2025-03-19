import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { SpriteBinParsePrgResult } from "./useSpriteBinParsePrg";
import { MinimalPrgSelector } from "./MinimalPrgSelector";

export function SpriteBinPrgSelector({
	parsedPrgData,
	setPrg,
}: {
	readonly parsedPrgData: SpriteBinParsePrgResult | undefined;
	readonly setPrg: (file: File | undefined) => Promise<void>;
}): ReactNode {
	return (
		<>
			<MinimalPrgSelector setPrg={setPrg} />
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
