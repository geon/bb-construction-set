import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/prg/parse-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItemsToCanvas } from "../../bb/image-data/draw-levels-to-canvas";

export function Items({
	parsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly prg: ArrayBuffer;
}): ReactNode {
	return <ImageDataCanvas imageData={drawItemsToCanvas(parsedPrg.items)} />;
}
