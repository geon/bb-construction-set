import { useEffect, useState } from "react";
import { parsePrg } from "./bb/parse-prg";
import { attempt } from "./bb/functions";

export type ParsePrgResult =
	| {
			readonly type: "ok";
			readonly result: ReturnType<typeof parsePrg>;
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function useParsePrg(prg: ArrayBuffer): ParsePrgResult | undefined {
	const [parsedPrgData, setParsedPrgData] = useState<
		ParsePrgResult | undefined
	>(undefined);

	useEffect(() => {
		setParsedPrgData(
			attempt(() => {
				const parsed = parsePrg(prg);
				return {
					...parsed,
				};
			})
		);
	}, [prg]);

	return parsedPrgData;
}
