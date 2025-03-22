import { useState } from "react";
import { writeSpritesBin } from "./bb/prg/sprites";
import { SpriteDataSegmentName } from "./bb/prg/data-locations";
import { attempt } from "./bb/functions";

export type ParseSpriteBinResult =
	| {
			readonly type: "ok";
			readonly result: {
				readonly spriteSegments: Record<SpriteDataSegmentName, Uint8Array>;
				readonly spriteColorsSegment: Uint8Array;
			};
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function useParseSpriteBin(): readonly [
	ParseSpriteBinResult | undefined,
	(file: ArrayBuffer | undefined) => Promise<void>
] {
	const [parsedSpriteBinData, setParsedSpriteBinData] = useState<
		ParseSpriteBinResult | undefined
	>(undefined);

	const setSpriteBin = async (file: ArrayBuffer | undefined): Promise<void> => {
		if (!file) {
			setParsedSpriteBinData(undefined);
			return;
		}

		const buffer = file;

		setParsedSpriteBinData(
			attempt(() => {
				const parsed = writeSpritesBin(new Uint8Array(buffer));
				return parsed;
			})
		);
	};

	return [parsedSpriteBinData, setSpriteBin];
}
