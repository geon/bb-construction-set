import { ReactNode, useState } from "react";
import { patchPrg } from "./bb/parse-prg";
import { LevelDataSegmentName } from "./bb/prg/data-locations";
import { CheckboxList } from "./CheckboxList";
import {
	getSpriteColorsFromPeFileSpriteSet,
	peFileDataToLevels,
} from "./bb/level-pe-conversion";
import { FileInput } from "./FileInput";
import { attempt } from "./bb/functions";
import { deserializePeFileData } from "./bb/pe-file";
import {
	drawLevelsToCanvas,
	drawPlatformCharsToCanvas,
} from "./bb/draw-levels-to-canvas";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { spriteColors } from "./bb/sprite";

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
	const [pes, setPes] = useState<readonly ArrayBuffer[] | undefined>();

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

	const [selectedSegments, setSelectedSegments] = useState(
		new Set<LevelDataSegmentName>([
			"bgColors",
			"platformChars",
			"sidebarChars",
			"sidebarCharsIndex",
			"shadowChars",
		])
	);

	const peColors =
		parsedPeData?.type !== "ok"
			? undefined
			: parsedPeData?.result.deserializedPeFileDatas[0]?.spriteSets[0];
	const colors =
		(peColors && getSpriteColorsFromPeFileSpriteSet(peColors)) ?? spriteColors;

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
					<ImageDataCanvas
						imageData={drawLevelsToCanvas(parsedPeData.result.levels, colors)}
					/>
					<ImageDataCanvas
						imageData={drawPlatformCharsToCanvas(parsedPeData.result.levels)}
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
							setPes(undefined);
						}}
					>
						Apply Patch
					</button>
				</>
			)}
		</>
	);
}
