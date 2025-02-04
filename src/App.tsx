import { useRef, useState } from "react";
import "./App.css";
import { parsePrg, patchPrg } from "./bb/parse-prg";
import { Level } from "./bb/level";
import { Sprites } from "./bb/sprite";
import {
	levelsToPeFileData,
	peFileDataToLevels,
} from "./bb/level-pe-conversion";
import { deserializePeFileData, serializePeFileData } from "./bb/pe-file";
import { CharBlock } from "./bb/charset-char";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { Levels } from "./Levels";
import { Card } from "./Card";

function App() {
	const [parsedPrgData, setParsedPrgData] = useState<
		| ({ fileName: string; fileSize: number } & (
				| {
						type: "success";
						prg: Uint8Array;
						levels: readonly Level[];
						sprites: Sprites;
						items: CharBlock[];
				  }
				| { type: "failed"; error: string }
		  ))
		| undefined
	>(undefined);

	const setPrg = async (file: File | undefined): Promise<void> => {
		if (!file) {
			setParsedPrgData(undefined);
			return;
		}

		try {
			const buffer = await file.arrayBuffer();
			const parsed = parsePrg(buffer);
			setParsedPrgData({
				type: "success",
				prg: new Uint8Array(buffer),
				...parsed,
				fileName: file.name,
				fileSize: file.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedPrgData({
				type: "failed",
				error: error.message,
				fileName: file.name,
				fileSize: file.size,
			});
		}
	};

	const [parsedPeData, setParsedPeData] = useState<
		| ({ fileName: string; fileSize: number } & (
				| { type: "success"; levels: readonly Level[] }
				| { type: "failed"; error: string }
		  ))
		| undefined
	>(undefined);

	const setPe = async (pe: File | undefined): Promise<void> => {
		if (!pe) {
			setParsedPeData(undefined);
			return;
		}

		try {
			const levels = peFileDataToLevels(
				deserializePeFileData(
					new TextDecoder("utf-8").decode(await pe.arrayBuffer())
				)
			);
			setParsedPeData({
				type: "success",
				levels,
				fileName: pe.name,
				fileSize: pe.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedPeData({
				type: "failed",
				error: error.message,
				fileName: pe.name,
				fileSize: pe.size,
			});
		}
	};

	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<h1>BB Construction Set</h1>
			<Card>
				<h2>Select a prg-file</h2>
				<p>
					Select an <i>unpacked</i> c64 .prg-file containing Bubble Bobble. Most
					.prg files you find will be <i>packed</i> and the c64 unpacks them on
					startup. You can use{" "}
					<a href="https://csdb.dk/release/?id=235681">Unp64</a> to unpack some
					of them.
				</p>
				<input
					type="file"
					onChange={(event) => setPrg(event.target.files?.[0])}
					ref={inputRef}
				/>
				<input
					type="button"
					value="Reload"
					onClick={() =>
						inputRef.current && setPrg(inputRef.current.files?.[0])
					}
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
			</Card>
			<Card>
				<h2>Select a PETSCII Editor-file</h2>
				<p>
					Save the file generated above, then edit it in the{" "}
					<a href="https://petscii.krissz.hu">PETSCII Editor web app</a>, save
					it and select it here.
				</p>
				<input
					type="file"
					onChange={(event) => setPe(event.target.files?.[0])}
				/>
				{!parsedPeData ? (
					<p>No pe selected.</p>
				) : parsedPeData?.type !== "success" ? (
					<p>Could not parse pe: {parsedPeData?.error ?? "No reason."}</p>
				) : (
					<>
						<Levels {...parsedPeData} />
					</>
				)}
			</Card>
			<Card>
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
			</Card>
		</>
	);
}

export default App;
