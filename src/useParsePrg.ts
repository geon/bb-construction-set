import { useEffect, useState } from "react";
import { parsePrg } from "./bb/parse-prg";
import { Attempt, attempt } from "./bb/functions";

export type ParsePrgResult = Attempt<ReturnType<typeof parsePrg>>;
export function useParsePrg(prg: ArrayBuffer): ParsePrgResult | undefined {
	const [parsedPrgData, setParsedPrgData] = useState<
		ParsePrgResult | undefined
	>(undefined);

	useEffect(() => {
		setParsedPrgData(attempt(() => parsePrg(prg)));
	}, [prg]);

	return parsedPrgData;
}
