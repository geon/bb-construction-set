import { ReactNode, useState } from "react";
import { patchPrg } from "./bb/parse-prg";
import { LevelDataSegmentName } from "./bb/prg/data-locations";
import { CheckboxList } from "./CheckboxList";
import {
	getSpriteColorsFromPeFileData,
	peFileDataToLevels,
} from "./bb/level-pe-conversion";
import { FileInput } from "./FileInput";
import { LevelCharsViewer } from "./LevelCharsViewer";
import { LevelsViewer } from "./LevelsViewer";
import { Attempt, attempt } from "./bb/functions";
import { deserializePeFileData, PeFileData } from "./bb/pe-file";
import { Level } from "./bb/level";

const segmentLabels: Record<LevelDataSegmentName, string> = {
	symmetry: "Symmetry",
	bitmaps: "Platforms",
	platformChars: "Platform Chars",
	bgColors: "Colors",
	shadowChars: "Shadow Chars",
	sidebarCharsIndex: "Side Border Char Indices",
	sidebarChars: "Side Border Chars",
	holeMetadata: "Hole Metadata",
	monsters: "Monsters",
	windCurrents: "Wind Currents",
};

export function LevelsPatcher({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer | undefined) => void;
}): ReactNode {
	const [parsedPeData, setParsedPeData] = useState<
		Attempt<{
			readonly levels: readonly Level[];
			readonly deserializedPeFileDatas: readonly PeFileData[];
		}>
	>();

	const setPes = (pes: readonly ArrayBuffer[]) =>
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

	const [selectedSegments, setSelectedSegments] = useState(
		new Set<LevelDataSegmentName>([
			"bgColors",
			"platformChars",
			"sidebarChars",
			"sidebarCharsIndex",
			"shadowChars",
		])
	);

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
			{!parsedPeData ? (
				<p>No pe selected.</p>
			) : parsedPeData?.type !== "ok" ? (
				<p>Could not parse pe: {parsedPeData?.error ?? "No reason."}</p>
			) : (
				<>
					<LevelsViewer
						{...parsedPeData}
						levels={parsedPeData.result.levels}
						spriteColors={getSpriteColorsFromPeFileData(
							parsedPeData.result.deserializedPeFileDatas[0]!
						)}
					/>
					<LevelCharsViewer
						{...parsedPeData}
						levels={parsedPeData.result.levels}
					/>
					<CheckboxList
						options={segmentLabels}
						selected={selectedSegments}
						setSelected={setSelectedSegments}
					/>
					<button
						onClick={() => {
							const patched = patchPrg(
								prg,
								parsedPeData.result.levels,
								selectedSegments,
								"retroForge"
							);
							setPrg(patched);
							setPes([]);
						}}
					>
						Apply Patch
					</button>
				</>
			)}
		</>
	);
}
