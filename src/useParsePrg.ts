import { useState } from "react";
import { CharBlock } from "./bb/charset-char";
import { Level } from "./bb/level";
import { parsePrg } from "./bb/parse-prg";
import { Sprites } from "./bb/sprite";
import { ItemDataSegmentName } from "./bb/prg/data-locations";

export type ParsePrgResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
	| {
			readonly type: "ok";
			readonly prg: Uint8Array;
			readonly levels: readonly Level[];
			readonly sprites: Sprites;
			readonly items: Record<ItemDataSegmentName, CharBlock[]>;
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  }
);
export function useParsePrg(): readonly [
	ParsePrgResult | undefined,
	(file: File | undefined) => Promise<void>
] {
	const [parsedPrgData, setParsedPrgData] = useState<
		ParsePrgResult | undefined
	>(undefined);

	const setPrg = async (file: File | undefined): Promise<void> => {
		if (!file) {
			setParsedPrgData(undefined);
			return;
		}

		const buffer = await file.arrayBuffer();

		try {
			const parsed = parsePrg(buffer);
			setParsedPrgData({
				type: "ok",
				prg: new Uint8Array(buffer),
				...parsed,
				fileName: file.name,
				fileSize: file.size,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedPrgData({
				type: "error",
				error: error.message,
				fileName: file.name,
				fileSize: file.size,
			});
		}
	};

	return [parsedPrgData, setPrg] as const;
}
