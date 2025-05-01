import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItems } from "../../bb/image-data/items";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";

export function Items({
	parsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<ImageDataCanvas
			imageData={imageDataFromPaletteImage(drawItems(parsedPrg.items))}
		/>
	);
}
