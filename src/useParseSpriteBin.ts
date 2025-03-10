import { useState } from "react";
import { writeSpritesBin } from "./bb/prg/sprites";
import { SpriteDataSegmentName } from "./bb/prg/data-locations";

export type ParseSpriteBinResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
	| {
			readonly type: "ok";
			readonly parsed: Record<SpriteDataSegmentName, Uint8Array>;
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  }
);
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

		try {
			const buffer = await file.arrayBuffer();
			const parsed = writeSpritesBin(new Uint8Array(buffer));
			setParsedSpriteBinData({
				type: "ok",
				parsed,
				fileName: file.name,
				fileSize: file.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedSpriteBinData({
				type: "error",
				error: error.message,
				fileName: file.name,
				fileSize: file.size,
			});
		}
	};

	return [parsedSpriteBinData, setSpriteBin];
}
