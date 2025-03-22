import { ReactNode } from "react";
import { Card } from "./Card";
import { SpriteBinPatchDownloader } from "./SpriteBinPatchDownloader";
import { SpriteBinSelector } from "./SpriteBinSelector";
import { useParseSpriteBin } from "./useParseSpriteBin";
import { SpriteBinPrgSelector } from "./SpriteBinPrgSelector";

export function PatchSprites({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const [parsedSpriteBinData, setSpriteBin] = useParseSpriteBin();
	return (
		<>
			<Card>
				<SpriteBinPrgSelector prg={prg} />
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
