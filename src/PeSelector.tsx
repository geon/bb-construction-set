import { ReactNode } from "react";
import { LevelsViewer } from "./LevelsViewer";
import { ParsePeResult } from "./useParsePe";
import { FileInput } from "./FileInput";
import { getSpriteColorsFromPeFileData } from "./bb/level-pe-conversion";

export function PeSelector({
	parsedPeData,
	setPe,
}: {
	readonly parsedPeData: ParsePeResult | undefined;
	readonly setPe: (pes: readonly File[]) => Promise<void>;
}): ReactNode {
	return (
		<>
			<h2>Select a PETSCII Editor-file</h2>
			<p>
				Save the file generated above, then edit it in the{" "}
				<a href="https://petscii.krissz.hu">PETSCII Editor web app</a>, save it
				and select it here.
			</p>
			<FileInput accept={["pe"]} multiple onChange={setPe}>
				Choose files
			</FileInput>
			{!parsedPeData ? (
				<p>No pe selected.</p>
			) : parsedPeData?.type !== "ok" ? (
				<p>Could not parse pe: {parsedPeData?.error ?? "No reason."}</p>
			) : (
				<>
					<LevelsViewer
						{...parsedPeData}
						levels={parsedPeData.result.levels}
						spriteColors={getSpriteColorsFromPeFileData(
							parsedPeData.result.deserializedPeFileDatas[0]!
						)}
					/>
				</>
			)}
		</>
	);
}
