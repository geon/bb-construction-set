import { useEffect, useRef, useState } from "react";
import "./App.css";
import { parsePrg } from "./parse-prg";
import { drawLevelsToCanvas } from "./draw-levels-to-canvas";

function App() {
	const [prg, setPrg] = useState<File | undefined>(undefined);

	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		(async () => {
			if (!canvasRef.current) {
				return;
			}

			if (!prg) {
				canvasRef.current
					.getContext("2d")
					?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
				return;
			}

			drawLevelsToCanvas(
				parsePrg(new DataView(await prg.arrayBuffer())),
				canvasRef.current
			);
		})();
	}, [prg, canvasRef.current]);

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
			<p>
				{!prg
					? "No prg selected."
					: `${prg.name}, ${Math.round(prg.size / 1024)} kB`}
			</p>
			<canvas ref={canvasRef} />
		</>
	);
}

export default App;
