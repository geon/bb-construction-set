import { useEffect, useRef, useState } from "react";
import "./App.css";
import { parsePrg } from "./parse-prg";
import {
	drawLevelsToCanvas,
	drawPlatformCharsToCanvas,
} from "./draw-levels-to-canvas";
import { clearCanvas } from "./draw-levels-to-canvas";
import { Level } from "./level";

function App() {
	const [levels, setLevels] = useState<
		| ({ fileName: string; fileSize: number } & (
				| { type: "success"; levels: readonly Level[] }
				| { type: "failed"; error: string }
		  ))
		| undefined
	>(undefined);

	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);
	const platformCharsCanvasRef = useRef<HTMLCanvasElement>(null);

	const setPrg = async (prg: File | undefined): Promise<void> => {
		if (!prg) {
			setLevels(undefined);
			return;
		}

		try {
			setLevels({
				type: "success",
				levels: parsePrg(new DataView(await prg.arrayBuffer())),
				fileName: prg.name,
				fileSize: prg.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setLevels({
				type: "failed",
				error: error.message,
				fileName: prg.name,
				fileSize: prg.size,
			});
		}
	};

	useEffect(() => {
		(async () => {
			if (!(levelsCanvasRef.current && platformCharsCanvasRef.current)) {
				return;
			}

			if (levels?.type !== "success") {
				clearCanvas(levelsCanvasRef.current);
				clearCanvas(platformCharsCanvasRef.current);
				return;
			}

			drawLevelsToCanvas(levels.levels, levelsCanvasRef.current);
			drawPlatformCharsToCanvas(levels.levels, platformCharsCanvasRef.current);
		})();
	}, [levels, levelsCanvasRef.current]);

	return (
		<>
			<h1>BB Construction Set</h1>
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
			/>
			{!levels ? (
				<p>No prg selected.</p>
			) : levels?.type !== "success" ? (
				<p>Could not parse prg: {levels?.error ?? "No reason."}</p>
			) : (
				<>
					<p>
						{`${levels.fileName}, ${Math.round(levels.fileSize / 1024)} kB`}
						<br />
						{levels.levels.filter((level) => level.isSymmetric).length}/100 are
						symmetric
						<br />
						{levels.levels.filter((level) => level.sidebarChars).length}/100
						have side decor
					</p>
					<canvas ref={levelsCanvasRef} />
					<br />
					<CanvasDownloadButton
						canvasRef={levelsCanvasRef}
						label="Download Image"
						fileName="bubble bobble c64 - all levels.png"
					/>
					<br />
					<br />
					<canvas ref={platformCharsCanvasRef} />
					<br />
					<CanvasDownloadButton
						canvasRef={platformCharsCanvasRef}
						label="Download Image"
						fileName="bubble bobble c64 - all platform chars.png"
					/>
				</>
			)}
		</>
	);
}

function CanvasDownloadButton(props: {
	canvasRef: React.RefObject<HTMLCanvasElement>;
	label: string;
	fileName: string;
}) {
	return (
		<input
			type="button"
			onClick={() => {
				if (!props.canvasRef.current) {
					return;
				}
				var link = document.createElement("a");
				link.download = props.fileName;
				link.href = props.canvasRef.current.toDataURL();
				link.click();
			}}
			value={props.label}
		/>
	);
}

export default App;
