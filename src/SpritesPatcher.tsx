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
			<FileInput accept={["bin"]} onChange={setSpriteBin}>
				Choose file
			</FileInput>
			<br />
			<br />
			{!parsedSpriteBinData ? (
				<p>No bin selected.</p>
			) : parsedSpriteBinData?.type !== "ok" ? (
				<p>Could not parse bin: {parsedSpriteBinData?.error ?? "No reason."}</p>
			) : (
				<></>
			)}

			{!parsedSpriteBinData ? (
				<p>Select both a prg and a pe file.</p>
			) : !(parsedSpriteBinData?.type == "ok") ? (
				<p>Select valid files.</p>
			) : (
				<>
					<button
						onClick={() => {
							const patched = patchPrgSpritesBin(
								prg,
								parsedSpriteBinData.result.parsed.spriteSegments,
								parsedSpriteBinData.result.parsed.spriteColorsSegment
							);
							setPrg(patched);
						}}
					>
						Apply Patch
					</button>
				</>
			)}
		</>
	);
}
