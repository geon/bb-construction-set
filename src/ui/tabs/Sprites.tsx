import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt } from "../../bb/functions";
import { parsePrgSpriteBin, patchPrgSpritesBin } from "../../bb/prg/parse-prg";
import {
	parseSpriteGroupsFromBin,
	parseSpriteGroupsFromPrg,
} from "../../bb/prg/sprites";
import { getDataSegment, getDataSegments } from "../../bb/prg/io";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "../../bb/prg/data-locations";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawSpritesToCanvas } from "../../bb/image-data/draw-levels-to-canvas";
import { FileInput } from "../FileInput";

export function Sprites({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer | undefined) => void;
}): ReactNode {
	const parsedPrgData = attempt(() => parsePrgSpriteBin(prg));

	const spriteGroups = parseSpriteGroupsFromPrg(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation)
	);

	return (
		<>
			{parsedPrgData.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData.error ?? "No reason."}</p>
			) : (
				<>
					<ImageDataCanvas imageData={drawSpritesToCanvas(spriteGroups)} />
					<br />
					<br />
					<BlobDownloadButton
						getBlob={() => ({
							blob: new Blob([parsedPrgData.result], {
								type: "application/json",
							}),
							fileName: "bubble bobble c64 - all sprites.bin",
						})}
						label="Download SpritePad bin-file."
					/>
				</>
			)}
			<p>
				Save the file generated above, then edit it in SpritePad, save it and
				select it here.
			</p>
			<FileInput
				accept={["bin"]}
				onChange={async (file) => {
					const buffer = await file?.arrayBuffer();

					const parsedSpriteBinData =
						buffer &&
						attempt(() => {
							const parsed = parseSpriteGroupsFromBin(new Uint8Array(buffer));
							return parsed;
						});

					if (parsedSpriteBinData?.type !== "ok") {
						alert(
							`Could not parse bin: ${
								parsedSpriteBinData?.error ?? "No reason."
							}`
						);
						return;
					}

					const patched = patchPrgSpritesBin(prg, parsedSpriteBinData.result);
					setPrg(patched);
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}
