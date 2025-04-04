import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { attempt } from "./bb/functions";
import { parsePrgSpriteBin } from "./bb/parse-prg";
import { SpritesViewer } from "./SpritesViewer";
import { parseSpriteGroupsFromPrg } from "./bb/prg/sprites";
import { getDataSegment, getDataSegments } from "./bb/prg/io";
import {
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "./bb/prg/data-locations";
import { spriteColors } from "./bb/sprite";

export function SpritesVisualizerWithBinDownload({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const parsedPrgData = attempt(() => parsePrgSpriteBin(prg));

	const spriteGroups = parseSpriteGroupsFromPrg(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation),
		spriteColors.player
	);

	return (
		<>
			{parsedPrgData.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData.error ?? "No reason."}</p>
			) : (
				<>
					<SpritesViewer spriteGroups={spriteGroups} />
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
		</>
	);
}
