import { useState } from "react";
import { writeSpritesBin } from "./bb/prg/sprites";
import { SpriteDataSegmentName } from "./bb/prg/data-locations";
import { attempt } from "./bb/functions";

export type ParseSpriteBinResult =
	| {
			readonly type: "ok";
			readonly result: {
				readonly parsed: {
					readonly spriteSegments: Record<SpriteDataSegmentName, Uint8Array>;
					readonly spriteColorsSegment: Uint8Array;
				};
			};
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function useParseSpriteBin(): readonly [
	ParseSpriteBinResult | undefined,
	(file: File | undefined) => Promise<void>
] {
	const [parsedSpriteBinData, setParsedSpriteBinData] = useState<
		ParseSpriteBinResult | undefined
	>(undefined);

	const setSpriteBin = async (file: File | undefined): Promise<void> => {
		if (!file) {
			setParsedSpriteBinData(undefined);
			return;
		}

		const buffer = await file.arrayBuffer();

		setParsedSpriteBinData(
			attempt(() => {
				const parsed = writeSpritesBin(new Uint8Array(buffer));
				return {
					parsed,
				};
			})
		);
	};

	return [parsedSpriteBinData, setSpriteBin];
}
