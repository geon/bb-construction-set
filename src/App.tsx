import { useEffect, useRef, useState } from "react";
import "./App.css";
import { parsePrg, patchPrg } from "./parse-prg";
import {
	drawLevelsToCanvas,
	drawPlatformCharsToCanvas,
} from "./draw-levels-to-canvas";
import { Level, levelIsSymmetric } from "./level";
import { maxAsymmetric, maxMonsters, maxSidebars } from "./prg/data-locations";
import { Sprites } from "./sprite";
import { levelsToPeFileData, peFileDataToLevels } from "./level-pe-conversion";
import { deserializePeFileData, serializePeFileData } from "./pe-file";
import styled from "styled-components";
import { CharBlock } from "./charset-char";

const Card = styled.div`
	background: white;
	box-shadow: 0px 2px 5px #00000066;
	border-radius: 5px;

	max-width: 600px;
	padding: 1em;

	margin-top: 2em;
`;

function App() {
	const [parsedPrgData, setParsedPrgData] = useState<
		| ({ fileName: string; fileSize: number } & (
				| {
						type: "success";
						prg: DataView;
						levels: readonly Level[];
						sprites: Sprites;
						items: CharBlock[];
				  }
				| { type: "failed"; error: string }
		  ))
		| undefined
	>(undefined);

	const setPrg = async (prg: File | undefined): Promise<void> => {
		if (!prg) {
			setParsedPrgData(undefined);
			return;
		}

		try {
			const dataView = new DataView(await prg.arrayBuffer());
			const parsed = parsePrg(dataView);
			setParsedPrgData({
				type: "success",
				prg: dataView,
				...parsed,
				fileName: prg.name,
				fileSize: prg.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedPrgData({
				type: "failed",
				error: error.message,
				fileName: prg.name,
				fileSize: prg.size,
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
								const prg = new Uint8Array(parsedPrgData.prg.buffer.slice(0));
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

function BlobDownloadButton(props: {
	getBlob: () => Blob;
	label: string;
	fileName: string;
}) {
	return (
		<input
			type="button"
			onClick={() => {
				var link = document.createElement("a");
				link.download = props.fileName;
				link.href = URL.createObjectURL(props.getBlob());
				link.click();
			}}
			value={props.label}
		/>
	);
}

export default App;

function Levels(props: {
	readonly fileName: string;
	readonly fileSize: number;
	readonly levels: readonly Level[];
}): React.ReactNode {
	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);
	const platformCharsCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		(async () => {
			if (!(levelsCanvasRef.current && platformCharsCanvasRef.current)) {
				return;
			}

			drawLevelsToCanvas(props.levels, levelsCanvasRef.current);
			drawPlatformCharsToCanvas(props.levels, platformCharsCanvasRef.current);
		})();
	}, [props.levels, levelsCanvasRef.current, platformCharsCanvasRef.current]);

	return (
		<>
			<p>
				{props.levels.filter((level) => !levelIsSymmetric(level.tiles)).length}/
				{maxAsymmetric} are asymmetric
				<br />
				{props.levels.filter((level) => level.sidebarChars).length}/
				{maxSidebars} have side decor
				<br />
				{props.levels.flatMap((level) => level.monsters).length}/{maxMonsters}{" "}
				monsters
			</p>
			<canvas ref={levelsCanvasRef} />
			<br />
			<canvas ref={platformCharsCanvasRef} />
		</>
	);
}
