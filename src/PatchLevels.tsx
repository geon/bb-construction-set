import { ReactNode } from "react";
import { Card } from "./Card";
import { PatchDownloader } from "./PatchDownloader";
import { PeSelector } from "./PeSelector";
import { LevelsVisualizerWithPeDownload } from "./LevelsVisualizerWithPeDownload";
import { useParsePe } from "./useParsePe";

export function PatchLevels({ prg }: { readonly prg: ArrayBuffer }): ReactNode {
	const [parsedPeData, setPe] = useParsePe();
	return (
		<>
			<Card>
				<LevelsVisualizerWithPeDownload prg={prg} />
			</Card>
			<Card>
				<PeSelector parsedPeData={parsedPeData} setPe={setPe} />
				<PatchDownloader prg={prg} parsedPeData={parsedPeData} />
			</Card>
		</>
	);
}
