import { useState } from "react";
import { Level } from "./bb/level";
import { peFileDataToLevels } from "./bb/level-pe-conversion";
import { deserializePeFileData, PeFileData } from "./bb/pe-file";
import { sum } from "./bb/functions";

export type ParsePeResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
	| {
			readonly type: "ok";
			readonly levels: readonly Level[];
			readonly deserializedPeFileDatas: PeFileData[];
	  }
	| {
			readonly type: "failed";
			readonly error: string;
	  }
);
export function useParsePe(): readonly [
	ParsePeResult | undefined,
	(pes: readonly File[]) => Promise<void>
] {
	const [parsedPeData, setParsedPeData] = useState<ParsePeResult | undefined>(
		undefined
	);

	const setPe = async (pes: readonly File[]): Promise<void> => {
		if (!pes.length) {
			setParsedPeData(undefined);
			return;
		}

		try {
			const deserializedPeFileDatas = (
				await Promise.all(
					pes.map(async (pe) => ({
						...pe,
						arrayBuffer: await pe.arrayBuffer(),
					}))
				)
			).map((pe) => {
				return deserializePeFileData(
					new TextDecoder("utf-8").decode(pe.arrayBuffer)
				);
			});

			const levels = deserializedPeFileDatas.flatMap(peFileDataToLevels);

			setParsedPeData({
				type: "ok",
				levels,
				fileName: pes.map((pe) => pe.name).join(", "),
				fileSize: sum(pes.map((pe) => pe.size)),
				deserializedPeFileDatas,
			});
		} catch (e: unknown) {
			const error = e instanceof Error ? e : undefined;

			setParsedPeData({
				type: "failed",
				error: error?.message ?? "unknown",
				fileName: pes.map((pe) => pe.name).join(", "),
				fileSize: sum(pes.map((pe) => pe.size)),
			});
		}
	};

	return [parsedPeData, setPe];
}
