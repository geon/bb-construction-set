import { ReactNode } from "react";
import { Card } from "./Card";
import { SpriteBinPatchDownloader } from "./SpriteBinPatchDownloader";
import { SpriteBinSelector } from "./SpriteBinSelector";
import { useParseSpriteBin } from "./useParseSpriteBin";
import { SpriteBinPrgSelector } from "./SpriteBinPrgSelector";
import { useSpriteBinParsePrg } from "./useSpriteBinParsePrg";

export function PatchSprites({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const parsedSpriteBinPrgData = useSpriteBinParsePrg(prg);
	const [parsedSpriteBinData, setSpriteBin] = useParseSpriteBin();
	// const [parsedSpriteBinData, setSpriteBin] = useSpriteBin();
	return (
		<>
			<Card>
				<SpriteBinPrgSelector parsedPrgData={parsedSpriteBinPrgData} />
			</Card>
			<Card>
				<SpriteBinSelector
					parsedSpriteBinData={parsedSpriteBinData}
					setSpriteBin={setSpriteBin}
				/>
				<SpriteBinPatchDownloader
					prg={prg}
					parsedSpriteBinData={parsedSpriteBinData}
				/>
			</Card>
		</>
	);
}
