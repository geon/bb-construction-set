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
	const [prg, setPrg] = useState<File | undefined>(undefined);

	const [levels, setLevels] = useState<readonly Level[] | undefined>(undefined);

	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);
	const platformCharsCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		(async () => {
			if (!prg) {
				return;
			}
			setLevels(parsePrg(new DataView(await prg.arrayBuffer())));
		})();
	}, [prg]);

	useEffect(() => {
		(async () => {
			if (!(levelsCanvasRef.current && platformCharsCanvasRef.current)) {
				return;
			}

			if (!levels) {
				clearCanvas(levelsCanvasRef.current);
				clearCanvas(platformCharsCanvasRef.current);
				return;
			}

			drawLevelsToCanvas(levels, levelsCanvasRef.current);
			drawPlatformCharsToCanvas(levels, platformCharsCanvasRef.current);
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
			{!prg ? (
				<p>No prg selected.</p>
			) : (
				<>
					<p>{`${prg.name}, ${Math.round(prg.size / 1024)} kB`}</p>
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
