import { ReactNode } from "react";
import { Levels } from "./Levels";
import { ParsePeResult } from "./useParsePe";
import { FileInput } from "./FileInput";

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
			) : parsedPeData?.type !== "success" ? (
				<p>Could not parse pe: {parsedPeData?.error ?? "No reason."}</p>
			) : (
				<>
					<Levels {...parsedPeData} />
				</>
			)}
		</>
	);
}
