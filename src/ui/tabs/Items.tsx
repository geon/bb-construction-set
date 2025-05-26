import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";
import { drawItemsToCanvas } from "../../bb/palette-image/item";
import { CharBlock } from "../../bb/internal-data-formats/char-group";

export function Items({
	parsedPrg,
	levelIndex,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
}): ReactNode {
	return (
		<ImageDataCanvas
			imageData={imageDataFromPaletteImage(
				doubleImageWidth(
					drawItemsToCanvas(
						parsedPrg.items,
						parsedPrg.chars.items as ReadonlyArray<CharBlock<2, 2>>,
						parsedPrg.levels[levelIndex]!
					)
				)
			)}
		/>
	);
}
