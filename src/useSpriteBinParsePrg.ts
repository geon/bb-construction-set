import { useState } from "react";
import { spriteDataSegmentLocations } from "./bb/prg/data-locations";
import { readSpritesBin } from "./bb/prg/sprites";
import { getDataSegments } from "./bb/prg/io";
import { attempt } from "./bb/functions";

export type SpriteBinParsePrgResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
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
	  }
);
export function useSpriteBinParsePrg(): readonly [
	SpriteBinParsePrgResult | undefined,
	(file: File | undefined) => Promise<void>
] {
	const [parsedPrgData, setParsedPrgData] = useState<
		SpriteBinParsePrgResult | undefined
	>(undefined);

	const setPrg = async (file: File | undefined): Promise<void> => {
		if (!file) {
			setParsedPrgData(undefined);
			return;
		}

		const prg = await file.arrayBuffer();

		setParsedPrgData({
			fileName: file.name,
			fileSize: file.size,
			...attempt(() => {
				const segments = getDataSegments(prg, spriteDataSegmentLocations);
				const spriteBin = readSpritesBin(segments);
				return {
					prg: new Uint8Array(prg),
					spriteBin,
				};
			}),
		});
	};

	return [parsedPrgData, setPrg] as const;
}
