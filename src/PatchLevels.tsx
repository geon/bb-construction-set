import { ReactNode } from "react";
import { Card } from "./Card";
import { PatchDownloader } from "./PatchDownloader";
import { PeSelector } from "./PeSelector";
import { PrgSelector } from "./PrgSelector";
import { useParsePe } from "./useParsePe";
import { useParsePrg } from "./useParsePrg";

export function PatchLevels({ prg }: { readonly prg: ArrayBuffer }): ReactNode {
	const parsedPrgData = useParsePrg(prg);
	const [parsedPeData, setPe] = useParsePe();
	return (
		<>
			<Card>
				<PrgSelector parsedPrgData={parsedPrgData} />
			</Card>
			<Card>
				<PeSelector parsedPeData={parsedPeData} setPe={setPe} />
				<PatchDownloader prg={prg} parsedPeData={parsedPeData} />
			</Card>
		</>
	);
}
