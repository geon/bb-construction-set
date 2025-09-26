import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import {
	drawCharGroups,
	parseCharGroups,
} from "../../bb/palette-image/char-groups";
import {
	imageDataFromImage,
	imageDataFromPaletteImage,
	imageDataToBlob,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import { attempt } from "../../bb/functions";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";

export function Chars({
	parsedPrg,
	setParsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(drawCharGroups(parsedPrg.chars))}
			/>
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => ({
					fileName: "chars.png",
					blob: await imageDataToBlob(
						imageDataFromPaletteImage(drawCharGroups(parsedPrg.chars))
					),
				})}
				label="Download image"
			/>
			<FileInput
				accept={["image/*"]}
				onChange={async (file) => {
					const imageData = imageDataFromImage(await imageFromFile(file));

					const parsedCharGroups = attempt(() =>
						parseCharGroups(paletteImageFromImageData(imageData))
					);

					if (parsedCharGroups.type !== "ok") {
						alert(
							`Could not read image: ${parsedCharGroups.error ?? "No reason."}`
						);
						return;
					}

					setParsedPrg({ ...parsedPrg, chars: parsedCharGroups.result });
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}

async function imageFromFile(file: File | Blob | MediaSource) {
	return await new Promise<HTMLImageElement>((resolve) => {
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(img.src);
			resolve(img);
		};
		img.src = URL.createObjectURL(file);
	});
}
