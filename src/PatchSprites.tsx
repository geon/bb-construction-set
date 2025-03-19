import { ReactNode } from "react";
import { Card } from "./Card";
import { SpriteBinPatchDownloader } from "./SpriteBinPatchDownloader";
import { SpriteBinSelector } from "./SpriteBinSelector";
import { useParseSpriteBin } from "./useParseSpriteBin";
import { SpriteBinPrgSelector } from "./SpriteBinPrgSelector";
import { SpriteBinParsePrgResult } from "./useSpriteBinParsePrg";

export function PatchSprites({
	parsedSpriteBinPrgData,
	setPrg,
}: {
	readonly parsedSpriteBinPrgData: SpriteBinParsePrgResult | undefined;
	readonly setPrg: (file: File | undefined) => Promise<void>;
}): ReactNode {
	const [parsedSpriteBinData, setSpriteBin] = useParseSpriteBin();
	// const [parsedSpriteBinData, setSpriteBin] = useSpriteBin();
	return (
		<>
			<Card>
				<SpriteBinPrgSelector
					parsedPrgData={parsedSpriteBinPrgData}
					setPrg={setPrg}
				/>
			</Card>
			<Card>
				<SpriteBinSelector
					parsedSpriteBinData={parsedSpriteBinData}
					setSpriteBin={setSpriteBin}
				/>
			</Card>
			<Card>
				<SpriteBinPatchDownloader
					parsedPrgData={parsedSpriteBinPrgData}
					parsedSpriteBinData={parsedSpriteBinData}
				/>
			</Card>
		</>
	);
}
