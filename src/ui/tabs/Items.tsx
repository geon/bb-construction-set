import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/prg/parse-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItems } from "../../bb/image-data/items";

export function Items({
	parsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return <ImageDataCanvas imageData={drawItems(parsedPrg.items)} />;
}
