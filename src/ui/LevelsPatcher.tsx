import { ReactNode, useState } from "react";
import { patchPrg } from "../bb/prg/parse-prg";
import { LevelDataSegmentName } from "../bb/game-definitions/level-segment-name";
import { CheckboxList } from "./CheckboxList";
import {
	getSpriteColorsFromPeFileSpriteSet,
	peFileDataToLevels,
} from "../bb/pe/level-pe-conversion";
import { FileInput } from "./FileInput";
import { attempt } from "../bb/functions";
import { deserializePeFileData } from "../bb/pe/pe-file";
import {
	drawLevelsToCanvas,
	drawPlatformCharsToCanvas,
} from "../bb/image-data/draw-levels-to-canvas";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { spriteColors } from "../bb/sprite";

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

	const [selectedSegments, setSelectedSegments] = useState(
		new Set<LevelDataSegmentName>([
			"bgColors",
			"platformChars",
			"sidebarChars",
			"sidebarCharsIndex",
			"shadowChars",
		])
	);

	const peSpriteSet =
		parsedPeData.result.deserializedPeFileDatas[0]?.spriteSets[0];

	return (
		<>
			<ImageDataCanvas
				imageData={drawLevelsToCanvas(
					parsedPeData.result.levels,
					peSpriteSet
						? getSpriteColorsFromPeFileSpriteSet(peSpriteSet)
						: spriteColors
				)}
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
	);
}
