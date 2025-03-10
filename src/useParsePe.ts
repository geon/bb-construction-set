import { useState } from "react";
import { Level } from "./bb/level";
import { peFileDataToLevels } from "./bb/level-pe-conversion";
import { deserializePeFileData, PeFileData } from "./bb/pe-file";
import { attempt, sum } from "./bb/functions";

export type ParsePeResult = {
	readonly fileName: string;
	readonly fileSize: number;
} & (
	| {
			readonly type: "ok";
			readonly result: {
				readonly levels: readonly Level[];
				readonly deserializedPeFileDatas: PeFileData[];
			};
	  }
	| {
			readonly type: "error";
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

		const buffers = await Promise.all(pes.map((pe) => pe.arrayBuffer()));

		setParsedPeData({
			fileName: pes.map((pe) => pe.name).join(", "),
			fileSize: sum(pes.map((pe) => pe.size)),
			...attempt(() => {
				const deserializedPeFileDatas = buffers.map((pe) => {
					return deserializePeFileData(new TextDecoder("utf-8").decode(pe));
				});

				const levels = deserializedPeFileDatas.flatMap(peFileDataToLevels);

				return {
					levels,
					deserializedPeFileDatas,
				};
			}),
		});
	};

	return [parsedPeData, setPe];
}
