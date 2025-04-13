import { ReactNode } from "react";
import { attempt } from "../../bb/functions";
import { parsePrg } from "../../bb/prg/parse-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItemsToCanvas } from "../../bb/image-data/draw-levels-to-canvas";

export function Items({ prg }: { readonly prg: ArrayBuffer }): ReactNode {
	const parsedPrg = attempt(() => parsePrg(prg));

	return (
		<>
			{parsedPrg.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrg.error ?? "No reason."}</p>
			) : (
				<>
					<ImageDataCanvas
						imageData={drawItemsToCanvas(parsedPrg.result.items)}
					/>
				</>
			)}
		</>
	);
}
