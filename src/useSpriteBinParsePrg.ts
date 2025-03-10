import { useState } from "react";
import { spriteDataSegmentLocations } from "./bb/prg/data-locations";
import { readSpritesBin } from "./bb/prg/sprites";
import { getDataSegments } from "./bb/prg/io";

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

		try {
			const segments = getDataSegments(prg, spriteDataSegmentLocations);
			const spriteBin = readSpritesBin(segments);
			setParsedPrgData({
				type: "ok",
				result: {
					prg: new Uint8Array(prg),
					spriteBin,
				},
				fileName: file.name,
				fileSize: file.size,
			});
		} catch (e: unknown) {
			const error = e instanceof Error ? e : undefined;

			setParsedPrgData({
				type: "error",
				error: error?.message ?? "unknown",
				fileName: file.name,
				fileSize: file.size,
			});
		}
	};

	return [parsedPrgData, setPrg] as const;
}
