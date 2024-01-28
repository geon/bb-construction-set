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
	const [parsedData, setParsedData] = useState<
		| ({ fileName: string; fileSize: number } & (
				| { type: "success"; levels: readonly Level[]; sprites: Sprites }
				| { type: "failed"; error: string }
		  ))
		| undefined
	>(undefined);

	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);

	const setPrg = async (prg: File | undefined): Promise<void> => {
		if (!prg) {
			setParsedData(undefined);
			return;
		}

		try {
			const parsed = parsePrg(new DataView(await prg.arrayBuffer()));
			setParsedData({
				type: "success",
				...parsed,
				fileName: prg.name,
				fileSize: prg.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedData({
				type: "failed",
				error: error.message,
				fileName: prg.name,
				fileSize: prg.size,
			});
		}
	};

	useEffect(() => {
		(async () => {
			if (!levelsCanvasRef.current) {
				return;
			}

			if (parsedData?.type !== "success") {
				clearCanvas(levelsCanvasRef.current);
				return;
			}

			drawLevelsToCanvas(parsedData.levels, levelsCanvasRef.current);
		})();
	}, [parsedData, levelsCanvasRef.current]);

	return (
		<>
			<h1>BB Construction Set</h1>
			<Card>
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
				{!parsedData ? (
					<p>No prg selected.</p>
				) : parsedData?.type !== "success" ? (
					<p>Could not parse prg: {parsedData?.error ?? "No reason."}</p>
				) : (
					<>
						<p>
							{`${parsedData.fileName}, ${Math.round(
								parsedData.fileSize / 1024
							)} kB`}
							<br />
							{parsedData.levels.filter((level) => !level.isSymmetric).length}/
							{maxAsymmetric} are asymmetric
							<br />
							{parsedData.levels.filter((level) => level.sidebarChars).length}/
							{maxSidebars} have side decor
						</p>
						<canvas ref={levelsCanvasRef} />
						<br />
						<BlobDownloadButton
							getBlob={() =>
								new Blob(
									[serializePeFileData(levelsToPeFileData(parsedData))],
									{
										type: "application/json",
									}
								)
							}
							label="Download PE-file"
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
