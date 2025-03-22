import { ReactNode } from "react";
import { patchPrgSpritesBin } from "./bb/parse-prg";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { ParseSpriteBinResult } from "./useParseSpriteBin";
import { SpriteBinParsePrgResult } from "./useSpriteBinParsePrg";

export function SpriteBinPatchDownloader({
	parsedPrgData,
	parsedSpriteBinData,
}: {
	readonly parsedPrgData: SpriteBinParsePrgResult | undefined;
	readonly parsedSpriteBinData: ParseSpriteBinResult | undefined;
}): ReactNode {
	return (
		<>
			<h2>Patch</h2>
			{!(parsedPrgData && parsedSpriteBinData) ? (
				<p>Select both a prg and a pe file.</p>
			) : !(
					parsedPrgData?.type == "ok" && parsedSpriteBinData?.type == "ok"
			  ) ? (
				<p>Select valid files.</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() => {
							const prg = parsedPrgData.result.prg.buffer;
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
