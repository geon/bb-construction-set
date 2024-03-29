import { useEffect, useRef, useState } from "react";
import "./App.css";
import { parsePrg } from "./parse-prg";
import { drawLevelsToCanvas } from "./draw-levels-to-canvas";
import { clearCanvas } from "./draw-levels-to-canvas";
import { Level, maxAsymmetric, maxSidebars } from "./level";
import { Sprites } from "./sprite";
import { levelsToPeFileData, peFileDataToLevels } from "./level-pe-conversion";
import { deserializePeFileData, serializePeFileData } from "./pe-file";
import styled from "styled-components";

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
				| { type: "success"; levels: readonly Level[]; sprites: Sprites }
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
			const parsed = parsePrg(new DataView(await prg.arrayBuffer()));
			setParsedPrgData({
				type: "success",
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

	const prgLevelsCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		(async () => {
			if (!prgLevelsCanvasRef.current) {
				return;
			}

			if (parsedPrgData?.type !== "success") {
				clearCanvas(prgLevelsCanvasRef.current);
				return;
			}

			drawLevelsToCanvas(parsedPrgData.levels, prgLevelsCanvasRef.current);
		})();
	}, [parsedPrgData, prgLevelsCanvasRef.current]);

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

	const peLevelsCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		(async () => {
			if (!peLevelsCanvasRef.current) {
				return;
			}

			if (parsedPeData?.type !== "success") {
				clearCanvas(peLevelsCanvasRef.current);
				return;
			}

			drawLevelsToCanvas(parsedPeData.levels, peLevelsCanvasRef.current);
		})();
	}, [parsedPeData, peLevelsCanvasRef.current]);

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
				/>
				{!parsedPrgData ? (
					<p>No prg selected.</p>
				) : parsedPrgData?.type !== "success" ? (
					<p>Could not parse prg: {parsedPrgData?.error ?? "No reason."}</p>
				) : (
					<>
						<p>
							{`${parsedPrgData.fileName}, ${Math.round(
								parsedPrgData.fileSize / 1024
							)} kB`}
							<br />
							{
								parsedPrgData.levels.filter((level) => !level.isSymmetric)
									.length
							}
							/{maxAsymmetric} are asymmetric
							<br />
							{
								parsedPrgData.levels.filter((level) => level.sidebarChars)
									.length
							}
							/{maxSidebars} have side decor
						</p>
						<canvas ref={prgLevelsCanvasRef} />
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
						<p>
							{`${parsedPeData.fileName}, ${Math.round(
								parsedPeData.fileSize / 1024
							)} kB`}
							<br />
							{parsedPeData.levels.filter((level) => !level.isSymmetric).length}
							/{maxAsymmetric} are asymmetric
							<br />
							{parsedPeData.levels.filter((level) => level.sidebarChars).length}
							/{maxSidebars} have side decor
						</p>
						<canvas ref={peLevelsCanvasRef} />
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
