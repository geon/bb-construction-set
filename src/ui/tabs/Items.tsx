import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItems } from "../../bb/palette-image/item";
import {
	imageDataFromPaletteImage,
	imageDataToBlob,
} from "../../bb/image-data/image-data";
import { BlobDownloadButton } from "../BlobDownloadButton";

export function Items({
	parsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(drawItems(parsedPrg.items))}
			/>
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => ({
					fileName: "items.png",
					blob: await imageDataToBlob(
						imageDataFromPaletteImage(drawItems(parsedPrg.items))
					),
				})}
				label="Download image"
			/>
		</>
	);
}
