import { ReactNode } from "react";
import { Card } from "./Card";
import { PatchDownloader } from "./PatchDownloader";
import { PeSelector } from "./PeSelector";
import { PrgSelector } from "./PrgSelector";
import { useParsePe } from "./useParsePe";
import { ParsePrgResult } from "./useParsePrg";

export function PatchLevels({
	parsedPrgData,
}: {
	readonly parsedPrgData: ParsePrgResult | undefined;
}): ReactNode {
	const [parsedPeData, setPe] = useParsePe();
	return (
		<>
			<Card>
				<PrgSelector parsedPrgData={parsedPrgData} />
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
