import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	serializeSpriteGroups,
	parseSpriteGroups,
} from "../../bb/sprite-bin/sprite-bin";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawSpritesToCanvas } from "../../bb/palette-image/sprite";
import { FileInput } from "../FileInput";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";

export function Sprites({
	parsedPrg,
	setParsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(
					doubleImageWidth(drawSpritesToCanvas(parsedPrg.sprites))
				)}
			/>
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => ({
					blob: new Blob([serializeSpriteGroups(parsedPrg.sprites)], {
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
						const parsed = parseSpriteGroups(new Uint8Array(buffer));
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
