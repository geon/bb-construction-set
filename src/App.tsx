import "./App.css";
import { Card } from "./Card";
import { useParsePrg } from "./useParsePrg";
import { useParsePe } from "./useParsePe";
import { PrgSelector } from "./PrgSelector";
import { PeSelector } from "./PeSelector";
import { PatchDownloader } from "./PatchDownloader";

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
