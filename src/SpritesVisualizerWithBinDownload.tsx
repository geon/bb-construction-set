import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { attempt } from "./bb/functions";
import { parsePrg, parsePrgSpriteBin } from "./bb/parse-prg";
import { SpritesViewer } from "./SpritesViewer";

export function SpritesVisualizerWithBinDownload({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const parsedPrgData = attempt(() => parsePrgSpriteBin(prg));

	const easyToRendersprites = parsePrg(prg).sprites;

	return (
		<>
			{parsedPrgData.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData.error ?? "No reason."}</p>
			) : (
				<>
					<SpritesViewer sprites={easyToRendersprites} />
					<br />
					<br />
					<BlobDownloadButton
						getBlob={() => ({
							blob: new Blob([parsedPrgData.result], {
								type: "application/json",
							}),
							fileName: "bubble bobble c64 - all sprites.bin",
						})}
						label="Download SpritePad bin-file."
					/>
				</>
			)}
		</>
	);
}
