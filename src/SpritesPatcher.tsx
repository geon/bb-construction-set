import { ReactNode } from "react";
import { patchPrgSpritesBin } from "./bb/parse-prg";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { ParseSpriteBinResult } from "./useParseSpriteBin";

export function SpritesPatcher({
	prg,
	parsedSpriteBinData,
}: {
	readonly prg: ArrayBuffer;
	readonly parsedSpriteBinData: ParseSpriteBinResult | undefined;
}): ReactNode {
	return (
		<>
			<h2>Patch</h2>
			{!parsedSpriteBinData ? (
				<p>Select both a prg and a pe file.</p>
			) : !(parsedSpriteBinData?.type == "ok") ? (
				<p>Select valid files.</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() => {
							try {
								const patched = patchPrgSpritesBin(
									prg,
									parsedSpriteBinData.result.parsed.spriteSegments,
									parsedSpriteBinData.result.parsed.spriteColorsSegment
								);
								return new Blob([patched], {
									type: "application/octet-stream",
								});
							} catch (error) {
								// setPatchError(error.message);
								throw error;
							}
						}}
						label="Download patched prg"
						fileName="custom bubble bobble.prg"
					/>
				</>
			)}
		</>
	);
}
