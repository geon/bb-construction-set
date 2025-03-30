import { ReactNode, useState } from "react";
import { patchPrgSpritesBin } from "./bb/parse-prg";
import { FileInput } from "./FileInput";
import { Attempt, attempt } from "./bb/functions";
import { parseSpriteBuffersFromBin } from "./bb/prg/sprites";

export function SpritesPatcher({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer | undefined) => void;
}): ReactNode {
	const [parsedSpriteBinData, setParsedSpriteBinData] = useState<
		Attempt<ReturnType<typeof parseSpriteBuffersFromBin>> | undefined
	>(undefined);

	const setSpriteBin = (buffer: ArrayBuffer | undefined) =>
		setParsedSpriteBinData(
			buffer &&
				attempt(() => {
					const parsed = parseSpriteBuffersFromBin(new Uint8Array(buffer));
					return parsed;
				})
		);

	return (
		<>
			<p>
				Save the file generated above, then edit it in SpritePad, save it and
				select it here.
			</p>
			<FileInput
				accept={["bin"]}
				onChange={async (file) => setSpriteBin(await file?.arrayBuffer())}
			>
				Choose file
			</FileInput>
			<br />
			<br />
			{!parsedSpriteBinData ? (
				<p>No bin selected.</p>
			) : parsedSpriteBinData?.type !== "ok" ? (
				<p>Could not parse bin: {parsedSpriteBinData?.error ?? "No reason."}</p>
			) : (
				<>
					<button
						onClick={() => {
							const patched = patchPrgSpritesBin(
								prg,
								parsedSpriteBinData.result.spriteSegments,
								parsedSpriteBinData.result.spriteColorsSegment
							);
							setPrg(patched);
							setSpriteBin(undefined);
						}}
					>
						Apply Patch
					</button>
				</>
			)}
		</>
	);
}
