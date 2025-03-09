import { useState } from "react";
import { spriteDataSegmentLocations } from "./bb/prg/data-locations";
import { readSpritesBin } from "./bb/prg/sprites";
import { getDataSegments } from "./bb/prg/io";

export type SpriteBinParsePrgResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
	| {
			readonly type: "success";
			readonly prg: Uint8Array;
			readonly spriteBin: Uint8Array;
	  }
	| {
			readonly type: "failed";
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

		try {
			const prg = await file.arrayBuffer();
			const segments = getDataSegments(prg, spriteDataSegmentLocations);
			const spriteBin = readSpritesBin(segments);
			setParsedPrgData({
				type: "success",
				prg: new Uint8Array(prg),
				spriteBin,
				fileName: file.name,
				fileSize: file.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedPrgData({
				type: "failed",
				error: error.message,
				fileName: file.name,
				fileSize: file.size,
			});
		}
	};

	return [parsedPrgData, setPrg] as const;
}
