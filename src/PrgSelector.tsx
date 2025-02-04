import { ReactNode, useRef } from "react";
import { levelsToPeFileData } from "./bb/level-pe-conversion";
import { serializePeFileData } from "./bb/pe-file";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { Levels } from "./Levels";
import { ParsePrgResult } from "./useParsePrg";

export function PrgSelector({
	parsedPrgData,
	setPrg,
}: {
	readonly parsedPrgData: ParsePrgResult | undefined;
	readonly setPrg: (file: File | undefined) => Promise<void>;
}): ReactNode {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<h2>Select a prg-file</h2>
			<p>
				Select an <i>unpacked</i> c64 .prg-file containing Bubble Bobble. Most
				.prg files you find will be <i>packed</i> and the c64 unpacks them on
				startup. You can use{" "}
				<a href="https://csdb.dk/release/?id=235681">Unp64</a> to unpack some of
				them.
			</p>
			<input
				type="file"
				onChange={(event) => setPrg(event.target.files?.[0])}
				ref={inputRef}
			/>
			<input
				type="button"
				value="Reload"
				onClick={() => inputRef.current && setPrg(inputRef.current.files?.[0])}
			/>
			{!parsedPrgData ? (
				<p>No prg selected.</p>
			) : parsedPrgData?.type !== "success" ? (
				<p>Could not parse prg: {parsedPrgData?.error ?? "No reason."}</p>
			) : (
				<>
					<Levels {...parsedPrgData} />
					<br />
					<BlobDownloadButton
						getBlob={() =>
							new Blob(
								[serializePeFileData(levelsToPeFileData(parsedPrgData))],
								{
									type: "application/json",
								}
							)
						}
						label="Download PETSCII Editor file"
						fileName="bubble bobble c64 - all levels.pe"
					/>
				</>
			)}
		</>
	);
}
