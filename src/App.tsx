import { useState } from "react";
import "./App.css";

function App() {
	const [prg, setPrg] = useState<File | undefined>(undefined);

	return (
		<>
			<h1>BB Construction Set</h1>
			<input
				type="file"
				onChange={(event) => setPrg(event.target.files?.[0])}
			/>
			<p>
				{!prg
					? "No prg selected."
					: `${prg.name}, ${Math.round(prg.size / 1024)} kB`}
			</p>
		</>
	);
}

export default App;
