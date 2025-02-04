import { ReactNode, useRef } from "react";
import "./App.css";
import { patchPrg } from "./bb/parse-prg";
import { levelsToPeFileData } from "./bb/level-pe-conversion";
import { serializePeFileData } from "./bb/pe-file";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { Levels } from "./Levels";
import { Card } from "./Card";
import { ParsePrgResult, useParsePrg } from "./useParsePrg";
import { ParsePeResult, useParsePe } from "./useParsePe";

function PrgSelector({
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

function PeSelector({
	parsedPeData,
	setPe,
}: {
	readonly parsedPeData: ParsePeResult | undefined;
	readonly setPe: (pe: File | undefined) => Promise<void>;
}): ReactNode {
	return (
		<>
			<h2>Select a PETSCII Editor-file</h2>
			<p>
				Save the file generated above, then edit it in the{" "}
				<a href="https://petscii.krissz.hu">PETSCII Editor web app</a>, save it
				and select it here.
			</p>
			<input type="file" onChange={(event) => setPe(event.target.files?.[0])} />
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

function PatchDownloader({
	parsedPrgData,
	parsedPeData,
}: {
	readonly parsedPrgData: ParsePrgResult | undefined;
	readonly parsedPeData: ParsePeResult | undefined;
}): ReactNode {
	return (
		<>
			<h2>Patch</h2>
			{!(parsedPrgData && parsedPeData) ? (
				<p>Select both a prg and a pe file.</p>
			) : !(
					parsedPrgData?.type == "success" && parsedPeData?.type == "success"
			  ) ? (
				<p>Select valid files.</p>
			) : (
				<>
					<BlobDownloadButton
						getBlob={() => {
							const prg = parsedPrgData.prg.buffer.slice(0);
							try {
								patchPrg(prg, parsedPeData.levels);
								return new Blob([prg], {
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

function App() {
	const [parsedPrgData, setPrg] = useParsePrg();
	const [parsedPeData, setPe] = useParsePe();

	return (
		<>
			<h1>BB Construction Set</h1>
			<Card>
				<PrgSelector parsedPrgData={parsedPrgData} setPrg={setPrg} />
			</Card>
			<Card>
				<PeSelector parsedPeData={parsedPeData} setPe={setPe} />
			</Card>
			<Card>
				<PatchDownloader
					parsedPrgData={parsedPrgData}
					parsedPeData={parsedPeData}
				/>
			</Card>
		</>
	);
}

export default App;
