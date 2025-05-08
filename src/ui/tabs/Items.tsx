import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawItems, parseItems } from "../../bb/palette-image/item";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { attempt } from "../../bb/functions";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { decodeBmp, encodeBmp } from "../../bb/palette-image/bmp";
import { FileInput } from "../FileInput";
import {
	doubleImageWidth,
	halfImageWidth,
} from "../../bb/palette-image/palette-image";

export function Items({
	parsedPrg,
	setParsedPrg,
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
					fileName: "items.bmp",
					blob: new Blob([
						encodeBmp(doubleImageWidth(drawItems(parsedPrg.items))),
					]),
				})}
				label="Download image"
			/>
			<FileInput
				accept={["bin"]}
				onChange={async (file) => {
					const buffer = await file.arrayBuffer();

					const parsedItems = attempt(() => {
						const parsed = parseItems(halfImageWidth(decodeBmp(buffer)));
						return parsed;
					});

					if (parsedItems.type !== "ok") {
						alert(`Could not read bmp: ${parsedItems.error ?? "No reason."}`);
						return;
					}

					setParsedPrg({ ...parsedPrg, items: parsedItems.result });
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}
