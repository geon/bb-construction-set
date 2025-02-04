import { ReactNode } from "react";
import { patchPrg } from "./bb/parse-prg";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { ParsePeResult } from "./useParsePe";
import { ParsePrgResult } from "./useParsePrg";

export function PatchDownloader({
	parsedPrgData,
	parsedPeData,
}: {
	readonly parsedPrgData: ParsePrgResult | undefined;
	readonly parsedPeData: ParsePeResult | undefined;
}): ReactNode {
	return (
		<>
			<h2>Patch</h2>
			{!(parsedPrgData && parsedPeData) ? (
				<p>Select both a prg and a pe file.</p>
			) : !(
					parsedPrgData?.type == "success" && parsedPeData?.type == "success"
			  ) ? (
				<p>Select valid files.</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() => {
							const prg = parsedPrgData.prg.buffer.slice(0);
							try {
								patchPrg(prg, parsedPeData.levels);
								return new Blob([prg], {
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
