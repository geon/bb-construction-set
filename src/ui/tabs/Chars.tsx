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
	imageFromFile,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import { attempt } from "../../bb/functions";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { FileInput } from "../FileInput";

export function Chars(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(
					drawCharGroups(props.parsedPrg.chars),
				)}
			/>
			<br />
			<br />
			<BlobDownloadButton
				getBlob={async () => ({
					fileName: "chars.png",
					blob: await imageDataToBlob(
						imageDataFromPaletteImage(drawCharGroups(props.parsedPrg.chars)),
					),
				})}
			>
				Download image
			</BlobDownloadButton>
			<FileInput
				accept={["image/*"]}
				onChange={async (file) => {
					const imageData = imageDataFromImage(await imageFromFile(file));

					const parsedCharGroups = attempt(() =>
						parseCharGroups(paletteImageFromImageData(imageData)),
					);

					if (parsedCharGroups.type !== "ok") {
						alert(
							`Could not read image: ${parsedCharGroups.error ?? "No reason."}`,
						);
						return;
					}

					props.setParsedPrg({
						...props.parsedPrg,
						chars: parsedCharGroups.result,
					});
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}
