import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { useSpriteBinParsePrg } from "./useSpriteBinParsePrg";

export function SpriteBinPrgSelector({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const parsedPrgData = useSpriteBinParsePrg(prg);

	return (
		<>
			{parsedPrgData?.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData?.error ?? "No reason."}</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() =>
							new Blob([parsedPrgData.result], {
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
