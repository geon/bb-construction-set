import { ReactNode } from "react";
import { FileInput } from "./FileInput";

export function PrgSelector({
	setPrg,
}: {
	readonly setPrg: (file: ArrayBuffer) => void;
}): ReactNode {
	return (
		<>
			<h2>Select a prg-file</h2>
			{/* <p>
				Select an <i>unpacked</i> c64 prg-file containing Bubble Bobble. Most
				prg-files you find will be <i>packed</i> and the c64 unpacks them on
				startup. Such packed prg:s can't be used.
			</p>
			<p>
				We recommend starting with the{" "}
				<a href="https://github.com/smnjameson/letsdissectagame/raw/refs/heads/master/Episode%2011%20-%20Bubble%20Bobble/bin/crack.prg">
					Shimmer bugfix by Shallan
				</a>
				.
			</p> */}
			<FileInput
				accept={["prg"]}
				onChange={async (file) => setPrg(await file.arrayBuffer())}
			>
				Choose file
			</FileInput>
		</>
	);
}
