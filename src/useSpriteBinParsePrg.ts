import { useEffect, useState } from "react";
import { readSpritesBin } from "./bb/prg/sprites";
import { Attempt, attempt } from "./bb/functions";
import { parsePrgSpriteBin } from "./bb/parse-prg";

export type SpriteBinParsePrgResult = Attempt<
	ReturnType<typeof readSpritesBin>
>;
export function useSpriteBinParsePrg(
	prg: ArrayBuffer
): SpriteBinParsePrgResult | undefined {
	const [parsedPrgData, setParsedPrgData] = useState<
		SpriteBinParsePrgResult | undefined
	>(undefined);

	useEffect(() => {
		setParsedPrgData(attempt(() => parsePrgSpriteBin(prg)));
	}, [prg]);

	return parsedPrgData;
}
