import { ReactNode, useState } from "react";
import { patchPrg } from "./bb/parse-prg";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { ParsePeResult } from "./useParsePe";
import { LevelDataSegmentName } from "./bb/prg/data-locations";
import { CheckboxList } from "./CheckboxList";

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
	parsedPeData,
}: {
	readonly prg: ArrayBuffer;
	readonly parsedPeData: ParsePeResult | undefined;
}): ReactNode {
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
			<h2>Patch</h2>
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
