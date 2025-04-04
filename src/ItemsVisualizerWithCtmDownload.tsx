import { ReactNode } from "react";
import { attempt } from "./bb/functions";
import { parsePrg } from "./bb/parse-prg";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { drawItemsToCanvas } from "./bb/draw-levels-to-canvas";

export function ItemsVisualizerWithCtmDownload({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	const parsedPrgData = attempt(() => parsePrg(prg));

	return (
		<>
			{parsedPrgData.type !== "ok" ? (
				<p>Could not parse prg: {parsedPrgData.error ?? "No reason."}</p>
			) : (
				<>
					<ImageDataCanvas
						imageData={drawItemsToCanvas(parsedPrgData.result.items)}
					/>
				</>
			)}
		</>
	);
}
