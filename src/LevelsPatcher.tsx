import { ReactNode, useState } from "react";
import { patchPrg } from "./bb/parse-prg";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { useParsePe } from "./useParsePe";
import { LevelDataSegmentName } from "./bb/prg/data-locations";
import { CheckboxList } from "./CheckboxList";
import { getSpriteColorsFromPeFileData } from "./bb/level-pe-conversion";
import { FileInput } from "./FileInput";
import { LevelCharsViewer } from "./LevelCharsViewer";
import { LevelsViewer } from "./LevelsViewer";

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
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const [parsedPeData, setPe] = useParsePe();

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
			<FileInput accept={["pe"]} multiple onChange={setPe}>
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
				</>
			)}

			{!parsedPeData ? (
				<p>Select both a prg and a pe file.</p>
			) : !(parsedPeData?.type == "ok") ? (
				<p>Select valid files.</p>
			) : (
				<>
					<CheckboxList
						options={segmentLabels}
						selected={selectedSegments}
						setSelected={setSelectedSegments}
					/>
					<BlobDownloadButton
						getBlob={() => {
							try {
								const patched = patchPrg(
									prg,
									parsedPeData.result.levels,
									selectedSegments,
									"retroForge"
								);
								return new Blob([patched], {
									type: "application/octet-stream",
								});
							} catch (error) {
								// setPatchError(error.message);
								throw error;
							}
						}}
						label="Download patched prg"
						fileName="custom bubble bobble.prg"
					/>
				</>
			)}
		</>
	);
}
