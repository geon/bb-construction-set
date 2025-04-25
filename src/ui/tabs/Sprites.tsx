import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	convertSpriteGroupsToBinFile,
	parseSpriteGroupsFromBin,
} from "../../bb/sprite-bin/sprite-bin";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawSpritesToCanvas } from "../../bb/image-data/draw-levels-to-canvas";
import { FileInput } from "../FileInput";

export function Sprites({
	parsedPrg,
	setParsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas imageData={drawSpritesToCanvas(parsedPrg.sprites)} />
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => ({
					blob: new Blob([convertSpriteGroupsToBinFile(parsedPrg.sprites)], {
						type: "application/json",
					}),
					fileName: "bubble bobble c64 - all sprites.bin",
				})}
				label="Download SpritePad bin-file."
			/>
			<p>
				Save the file generated above, then edit it in SpritePad, save it and
				select it here.
			</p>
			<FileInput
				accept={["bin"]}
				onChange={async (file) => {
					const buffer = await file.arrayBuffer();

					const parsedSpriteBinData = attempt(() => {
						const parsed = parseSpriteGroupsFromBin(new Uint8Array(buffer));
						return parsed;
					});

					if (parsedSpriteBinData.type !== "ok") {
						alert(
							`Could not parse bin: ${
								parsedSpriteBinData.error ?? "No reason."
							}`
						);
						return;
					}

					setParsedPrg({ ...parsedPrg, sprites: parsedSpriteBinData.result });
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}
