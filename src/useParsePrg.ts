import { useEffect, useState } from "react";
import { CharBlock } from "./bb/charset-char";
import { Level } from "./bb/level";
import { parsePrg } from "./bb/parse-prg";
import { Sprites } from "./bb/sprite";
import { ItemDataSegmentName } from "./bb/prg/data-locations";
import { attempt } from "./bb/functions";

export type ParsePrgResult =
	| {
			readonly type: "ok";
			readonly result: {
				readonly levels: readonly Level[];
				readonly sprites: Sprites;
				readonly items: Record<ItemDataSegmentName, CharBlock[]>;
			};
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function useParsePrg(file: ArrayBuffer): ParsePrgResult | undefined {
	const [parsedPrgData, setParsedPrgData] = useState<
		ParsePrgResult | undefined
	>(undefined);

	useEffect(() => {
		(async () => {
			const buffer = file;

			setParsedPrgData(
				attempt(() => {
					const parsed = parsePrg(buffer);
					return {
						...parsed,
					};
				})
			);
		})();
	}, [file]);

	return parsedPrgData;
}
