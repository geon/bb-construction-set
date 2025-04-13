import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt } from "../../bb/functions";
import { ParsedPrg, patchPrg } from "../../bb/prg/parse-prg";
import {
	convertSpriteGroupsToBinFile,
	parseSpriteGroupsFromBin,
} from "../../bb/sprite-bin/sprite-bin";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawSpritesToCanvas } from "../../bb/image-data/draw-levels-to-canvas";
import { FileInput } from "../FileInput";

export function Sprites({
	parsedPrg,
	prg,
	setPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas imageData={drawSpritesToCanvas(parsedPrg.sprites)} />
			<br />
			<br />
			<BlobDownloadButton
				getBlob={() => ({
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

					const patched = patchPrg(
						prg,
						{ ...parsedPrg, sprites: parsedSpriteBinData.result },
						"retroForge"
					);
					setPrg(patched);
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}
