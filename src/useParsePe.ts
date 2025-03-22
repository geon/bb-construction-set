import { useState } from "react";
import { Level } from "./bb/level";
import { peFileDataToLevels } from "./bb/level-pe-conversion";
import { deserializePeFileData, PeFileData } from "./bb/pe-file";
import { attempt } from "./bb/functions";

export type ParsePeResult =
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
	  };
export function useParsePe(): readonly [
	ParsePeResult | undefined,
	(pes: readonly ArrayBuffer[]) => Promise<void>
] {
	const [parsedPeData, setParsedPeData] = useState<ParsePeResult | undefined>(
		undefined
	);

	const setPe = async (pes: readonly ArrayBuffer[]): Promise<void> => {
		if (!pes.length) {
			setParsedPeData(undefined);
			return;
		}

		setParsedPeData(
			attempt(() => {
				const deserializedPeFileDatas = pes.map((buffer) =>
					deserializePeFileData(new TextDecoder("utf-8").decode(buffer))
				);
				const levels = deserializedPeFileDatas.flatMap(peFileDataToLevels);

				return {
					levels,
					deserializedPeFileDatas,
				};
			})
		);
	};

	return [parsedPeData, setPe];
}
