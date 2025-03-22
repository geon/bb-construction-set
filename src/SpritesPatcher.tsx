import { ReactNode } from "react";
import { patchPrgSpritesBin } from "./bb/parse-prg";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { useParseSpriteBin } from "./useParseSpriteBin";
import { FileInput } from "./FileInput";

export function SpritesPatcher({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const [parsedSpriteBinData, setSpriteBin] = useParseSpriteBin();

	return (
		<>
			<h2>Select a SpritePad bin-file</h2>
			<p>
				Save the file generated above, then edit it in SpritePad, save it and
				select it here.
			</p>
			<FileInput accept={["bin"]} onChange={setSpriteBin}>
				Choose file
			</FileInput>
			{!parsedSpriteBinData ? (
				<p>No bin selected.</p>
			) : parsedSpriteBinData?.type !== "ok" ? (
				<p>Could not parse bin: {parsedSpriteBinData?.error ?? "No reason."}</p>
			) : (
				<></>
			)}

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
