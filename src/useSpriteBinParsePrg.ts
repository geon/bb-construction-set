import { useEffect, useState } from "react";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "./bb/prg/data-locations";
import { readSpritesBin } from "./bb/prg/sprites";
import { getDataSegment, getDataSegments } from "./bb/prg/io";
import { attempt } from "./bb/functions";
import { spriteColors } from "./bb/sprite";

export type SpriteBinParsePrgResult =
	| {
			readonly type: "ok";
			readonly result: {
				readonly prg: Uint8Array;
				readonly spriteBin: Uint8Array;
			};
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function useSpriteBinParsePrg(
	file: ArrayBuffer
): SpriteBinParsePrgResult | undefined {
	const [parsedPrgData, setParsedPrgData] = useState<
		SpriteBinParsePrgResult | undefined
	>(undefined);

	useEffect(() => {
		(async () => {
			const prg = file;

			setParsedPrgData(
				attempt(() => {
					const segments = getDataSegments(prg, spriteDataSegmentLocations);
					const monsterColorsSegment = getDataSegment(
						prg,
						monsterSpriteColorsSegmentLocation
					);
					const spriteBin = readSpritesBin(
						segments,
						monsterColorsSegment,
						spriteColors.player
					);
					return {
						prg: new Uint8Array(prg),
						spriteBin,
					};
				})
			);
		})();
	}, [file]);

	return parsedPrgData;
}
