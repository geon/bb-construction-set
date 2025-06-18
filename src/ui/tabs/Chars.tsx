import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import {
	drawCharGroups,
	parseCharGroups,
} from "../../bb/palette-image/char-groups";
import {
	imageDataFromPaletteImage,
	imageDataToBlob,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import { attempt } from "../../bb/functions";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";
import { halfImageWidth } from "../../bb/palette-image/palette-image";

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
				accept={["bin"]}
				onChange={async (file) => {
					const imageData = imageDataFromImage(await imageFromFile(file));

					const parsedCharGroups = attempt(() =>
						parseCharGroups(
							halfImageWidth(paletteImageFromImageData(imageData))
						)
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

function imageDataFromImage(img: HTMLImageElement) {
	// Da'faque?
	// https://stackoverflow.com/a/79528941/446536
	const videoframe = new VideoFrame(img, {
		timestamp: 0,
	});
	const buffer = new ArrayBuffer(videoframe.allocationSize());
	videoframe.copyTo(buffer, { format: "RGBA" });
	videoframe.close();
	const imageData = new ImageData(
		new Uint8ClampedArray(buffer),
		img.width,
		img.height
	);
	return imageData;
}
