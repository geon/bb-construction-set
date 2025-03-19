import { ReactNode } from "react";
import { FileInput } from "./FileInput";

export function MinimalPrgSelector({
	setPrg,
}: {
	readonly setPrg: (file: File | undefined) => void;
}): ReactNode {
	return (
		<>
			<h2>Select a prg-file</h2>
			<p>
				Select an <i>unpacked</i> c64 .prg-file containing Bubble Bobble. Most
				.prg files you find will be <i>packed</i> and the c64 unpacks them on
				startup.
			</p>
			<FileInput accept={["prg"]} onChange={setPrg}>
				Choose file
			</FileInput>
		</>
	);
}
