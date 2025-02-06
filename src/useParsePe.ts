import { useState } from "react";
import { Level } from "./bb/level";
import { peFileDataToLevels } from "./bb/level-pe-conversion";
import { deserializePeFileData, PeFileData } from "./bb/pe-file";

export type ParsePeResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
	| {
			readonly type: "success";
			readonly levels: readonly Level[];
			readonly deserializedPeFileData: PeFileData;
	  }
	| {
			readonly type: "failed";
			readonly error: string;
	  }
);
export function useParsePe(): readonly [
	ParsePeResult | undefined,
	(pe: File | undefined) => Promise<void>
] {
	const [parsedPeData, setParsedPeData] = useState<ParsePeResult | undefined>(
		undefined
	);

	const setPe = async (pe: File | undefined): Promise<void> => {
		if (!pe) {
			setParsedPeData(undefined);
			return;
		}

		try {
			const deserializedPeFileData = deserializePeFileData(
				new TextDecoder("utf-8").decode(await pe.arrayBuffer())
			);
			const levels = peFileDataToLevels(deserializedPeFileData);
			setParsedPeData({
				type: "success",
				levels,
				fileName: pe.name,
				fileSize: pe.size,
				deserializedPeFileData,
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				return;
			}
			setParsedPeData({
				type: "failed",
				error: error.message,
				fileName: pe.name,
				fileSize: pe.size,
			});
		}
	};

	return [parsedPeData, setPe];
}
