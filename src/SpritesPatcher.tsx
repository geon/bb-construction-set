import { ReactNode } from "react";
import { patchPrgSpritesBin } from "./bb/parse-prg";
import { useParseSpriteBin } from "./useParseSpriteBin";
import { FileInput } from "./FileInput";

export function SpritesPatcher({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer | undefined) => void;
}): ReactNode {
	const [parsedSpriteBinData, setSpriteBin] = useParseSpriteBin();

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
