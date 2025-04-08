import { ReactNode, useState } from "react";
import { patchPrg } from "../bb/prg/parse-prg";
import { LevelDataSegmentName } from "../bb/game-definitions/level-segment-name";
import { peFileDataToLevels } from "../bb/pe/level-pe-conversion";
import { FileInput } from "./FileInput";
import { attempt } from "../bb/functions";
import { deserializePeFileData } from "../bb/pe/pe-file";
import { drawPlatformCharsToCanvas } from "../bb/image-data/draw-levels-to-canvas";
import { ImageDataCanvas } from "./ImageDataCanvas";

export function LevelGraphicsPatcher({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer) => void;
}): ReactNode {
	const [pes, setPes] = useState<readonly ArrayBuffer[] | undefined>();

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
				onChange={async (files) =>
					setPes(await Promise.all(files.map((file) => file.arrayBuffer())))
				}
			>
				Choose files
			</FileInput>
			<Patcher prg={prg} setPrg={setPrg} pes={pes} setPes={setPes} />
		</>
	);
}

function Patcher({
	prg,
	setPrg,
	pes,
	setPes,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer) => void;
	readonly pes: readonly ArrayBuffer[] | undefined;
	readonly setPes: (pes: readonly ArrayBuffer[] | undefined) => void;
}): JSX.Element {
	const parsedPeData =
		pes &&
		attempt(() => {
			const deserializedPeFileDatas = pes.map((buffer) =>
				deserializePeFileData(new TextDecoder("utf-8").decode(buffer))
			);
			const levels = deserializedPeFileDatas.flatMap(peFileDataToLevels);

			return {
				levels,
				deserializedPeFileDatas,
			};
		});

	if (!parsedPeData) {
		return <p>No pe selected.</p>;
	}

	if (parsedPeData?.type !== "ok") {
		return <p>Could not parse pe: {parsedPeData?.error ?? "No reason."}</p>;
	}

	return (
		<>
			<ImageDataCanvas
				imageData={drawPlatformCharsToCanvas(parsedPeData.result.levels)}
			/>
			<button
				onClick={() => {
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
					setPes(undefined);
				}}
			>
				Apply Patch
			</button>
		</>
	);
}
