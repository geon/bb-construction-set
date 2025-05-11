import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItems } from "../../bb/palette-image/item";
import {
	imageDataFromPaletteImage,
	imageDataToBlob,
} from "../../bb/image-data/image-data";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";

export function Items({
	parsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(
					doubleImageWidth(drawItems(parsedPrg.items))
				)}
			/>
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => ({
					fileName: "items.png",
					blob: await imageDataToBlob(
						imageDataFromPaletteImage(
							doubleImageWidth(drawItems(parsedPrg.items))
						)
					),
				})}
				label="Download image"
			/>
		</>
	);
}
