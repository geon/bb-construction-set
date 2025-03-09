import { ReactNode } from "react";
import { FileInput } from "./FileInput";
import { ParseSpriteBinResult } from "./useParseSpriteBin";

export function SpriteBinSelector({
	parsedSpriteBinData,
	setSpriteBin,
}: {
	readonly parsedSpriteBinData: ParseSpriteBinResult | undefined;
	readonly setSpriteBin: (bin: File | undefined) => Promise<void>;
}): ReactNode {
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
			) : parsedSpriteBinData?.type !== "success" ? (
				<p>Could not parse bin: {parsedSpriteBinData?.error ?? "No reason."}</p>
			) : (
				<></>
			)}
		</>
	);
}
