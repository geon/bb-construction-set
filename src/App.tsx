import { useEffect, useRef, useState } from "react";
import "./App.css";
import { parsePrg } from "./parse-prg";
import { drawLevelsToCanvas } from "./draw-levels-to-canvas";
import { clearCanvas } from "./draw-levels-to-canvas";
import { Level, maxAsymmetric, maxSidebars } from "./level";
import { Sprites } from "./sprite";
import { levelsToPeFileData } from "./level-pe-conversion";
import { serializePeFileData } from "./pe-file";
import styled from "styled-components";

const Card = styled.div`
	background: white;
	box-shadow: 0px 2px 5px #00000066;
	border-radius: 5px;

	max-width: 600px;
	padding: 1em;
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

	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		(async () => {
			if (!levelsCanvasRef.current) {
				return;
			}

			if (parsedPrgData?.type !== "success") {
				clearCanvas(levelsCanvasRef.current);
				return;
			}

			drawLevelsToCanvas(parsedPrgData.levels, levelsCanvasRef.current);
		})();
	}, [parsedPrgData, levelsCanvasRef.current]);

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
						<canvas ref={levelsCanvasRef} />
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
							label="Download PETSCII Editor file."
							fileName="bubble bobble c64 - all levels.pe"
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
