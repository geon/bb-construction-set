import { ReactNode } from "react";
import { Card } from "./Card";
import { PatchDownloader } from "./PatchDownloader";
import { PeSelector } from "./PeSelector";
import { PrgSelector } from "./PrgSelector";
import { useParsePe } from "./useParsePe";
import { ParsePrgResult } from "./useParsePrg";

export function PatchLevels({
	parsedPrgData,
	setPrg,
}: {
	readonly parsedPrgData: ParsePrgResult | undefined;
	readonly setPrg: (file: File | undefined) => Promise<void>;
}): ReactNode {
	const [parsedPeData, setPe] = useParsePe();
	return (
		<>
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
