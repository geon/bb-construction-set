import { useEffect, useState } from "react";
import { readSpritesBin } from "./bb/prg/sprites";
import { attempt } from "./bb/functions";
import { parsePrgSpriteBin } from "./bb/parse-prg";

export type SpriteBinParsePrgResult =
	| {
			readonly type: "ok";
			readonly result: ReturnType<typeof readSpritesBin>;
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function useSpriteBinParsePrg(
	prg: ArrayBuffer
): SpriteBinParsePrgResult | undefined {
	const [parsedPrgData, setParsedPrgData] = useState<
		SpriteBinParsePrgResult | undefined
	>(undefined);

	useEffect(() => {
		setParsedPrgData(
			attempt(() => {
				const spriteBin = parsePrgSpriteBin(prg);
				return spriteBin;
			})
		);
	}, [prg]);

	return parsedPrgData;
}
