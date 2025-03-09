import { ReactNode } from "react";
import { Card } from "./Card";
import { SpriteBinPatchDownloader } from "./SpriteBinPatchDownloader";
import { SpriteBinSelector } from "./SpriteBinSelector";
import { useParseSpriteBin } from "./useParseSpriteBin";
import { SpriteBinPrgSelector } from "./SpriteBinPrgSelector";
import { useSpriteBinParsePrg } from "./useSpriteBinParsePrg";

export function PatchSprites(): ReactNode {
	const [parsedPrgData, setPrg] = useSpriteBinParsePrg();
	const [parsedSpriteBinData, setSpriteBin] = useParseSpriteBin();
	// const [parsedSpriteBinData, setSpriteBin] = useSpriteBin();
	return (
		<>
			<Card>
				<SpriteBinPrgSelector parsedPrgData={parsedPrgData} setPrg={setPrg} />
			</Card>
			<Card>
				<SpriteBinSelector
					parsedSpriteBinData={parsedSpriteBinData}
					setSpriteBin={setSpriteBin}
				/>
			</Card>
			<Card>
				<SpriteBinPatchDownloader
					parsedPrgData={parsedPrgData}
					parsedSpriteBinData={parsedSpriteBinData}
				/>
			</Card>
		</>
	);
}
