import { ReactNode } from "react";
import { Card } from "./Card";
import { PeDownloader } from "./PeDownloader";
import { PeSelector } from "./PeSelector";
import { useParsePe } from "./useParsePe";

export function ReformatPe(): ReactNode {
	const [parsedPeData, setPe] = useParsePe();
	return (
		<>
			<Card>
				<PeSelector parsedPeData={parsedPeData} setPe={setPe} />
			</Card>
			<Card>
				<PeDownloader parsedPeData={parsedPeData} />
			</Card>
		</>
	);
}
