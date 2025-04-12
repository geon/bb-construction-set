import { ReactNode } from "react";
import { patchPrg } from "../bb/prg/parse-prg";
import { LevelDataSegmentName } from "../bb/game-definitions/level-segment-name";
import { peFileDataToLevels } from "../bb/pe/level-pe-conversion";
import { FileInput } from "./FileInput";
import { attempt } from "../bb/functions";
import { deserializePeFileData } from "../bb/pe/pe-file";

export function LevelGraphicsPatcher({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer) => void;
}): ReactNode {
	return (
		<>
			<p>
				Save the file generated above, then edit it in the{" "}
				<a href="https://petscii.krissz.hu">PETSCII Editor web app</a>, save it
				and select it here.
			</p>
			<FileInput
				accept={["pe"]}
				multiple
				onChange={async (files) => {
					const pes = await Promise.all(
						files.map((file) => file.arrayBuffer())
					);

					const parsedPeData =
						pes &&
						attempt(() => {
							const deserializedPeFileDatas = pes.map((buffer) =>
								deserializePeFileData(new TextDecoder("utf-8").decode(buffer))
							);
							const levels =
								deserializedPeFileDatas.flatMap(peFileDataToLevels);

							return {
								levels,
								deserializedPeFileDatas,
							};
						});

					if (parsedPeData?.type !== "ok") {
						alert(`Could not parse pe: ${parsedPeData?.error ?? "No reason."}`);
						return;
					}

					const patched = patchPrg(
						prg,
						parsedPeData.result.levels,
						new Set<LevelDataSegmentName>([
							"bgColors",
							"platformChars",
							"sidebarChars",
							"sidebarCharsIndex",
							"shadowChars",
						]),
						"retroForge"
					);
					setPrg(patched);
				}}
			>
				Choose files
			</FileInput>
		</>
	);
}
