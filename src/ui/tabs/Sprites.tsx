import { ReactNode } from "react";
import { BlobDownloadButton } from "../BlobDownloadButton";
import { attempt } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	serializeSpriteGroups,
	parseSpriteGroups,
} from "../../bb/sprite-bin/sprite-bin";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { drawSprites, parseSprites } from "../../bb/palette-image/sprite";
import { FileInput } from "../FileInput";
import {
	imageDataFromImage,
	imageDataFromPaletteImage,
	imageDataToBlob,
	imageFromFile,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import {
	doubleImageWidth,
	halfImageWidth,
} from "../../bb/palette-image/palette-image";
import { ButtonGroup } from "../ButtonGroup";
import { ButtonRow } from "../ButtonRow";
import { Flex } from "../Flex";

export function Sprites(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(
					doubleImageWidth(drawSprites(props.parsedPrg.sprites))
				)}
			/>
			<br />
			<br />
			<Flex $col>
				<ButtonRow $align="left">
					<span>SpritePad bin-file:</span>
					<ButtonGroup>
						<BlobDownloadButton
							getBlob={async () => ({
								blob: new Blob(
									[serializeSpriteGroups(props.parsedPrg.sprites)],
									{
										type: "application/json",
									}
								),
								fileName: "bubble bobble c64 - all sprites.bin",
							})}
						>
							Save
						</BlobDownloadButton>
						<FileInput
							accept={["bin"]}
							onChange={async (file) => {
								const buffer = await file.arrayBuffer();

								const parsedSpriteBinData = attempt(() => {
									const parsed = parseSpriteGroups(new Uint8Array(buffer));
									return parsed;
								});

								if (parsedSpriteBinData.type !== "ok") {
									alert(
										`Could not parse bin: ${
											parsedSpriteBinData.error ?? "No reason."
										}`
									);
									return;
								}

								props.setParsedPrg({
									...props.parsedPrg,
									sprites: parsedSpriteBinData.result,
								});
							}}
						>
							Open...
						</FileInput>
					</ButtonGroup>
				</ButtonRow>
				<ButtonRow $align="left">
					<span>Sprite Sheet:</span>
					<ButtonGroup>
						<BlobDownloadButton
							getBlob={async () => ({
								blob: await imageDataToBlob(
									imageDataFromPaletteImage(
										doubleImageWidth(drawSprites(props.parsedPrg.sprites))
									)
								),
								fileName: "bubble bobble c64 - all sprites.png",
							})}
						>
							Save
						</BlobDownloadButton>
						<FileInput
							accept={["bin"]}
							onChange={async (file) => {
								const imageData = imageDataFromImage(await imageFromFile(file));

								const parsedSpriteBinData = attempt(() => {
									const parsed = parseSprites(
										halfImageWidth(paletteImageFromImageData(imageData))
									);
									return parsed;
								});

								if (parsedSpriteBinData.type !== "ok") {
									alert(
										`Could not parse bin: ${
											parsedSpriteBinData.error ?? "No reason."
										}`
									);
									return;
								}

								props.setParsedPrg({
									...props.parsedPrg,
									sprites: parsedSpriteBinData.result,
								});
							}}
						>
							Open...
						</FileInput>
					</ButtonGroup>
				</ButtonRow>
			</Flex>
		</>
	);
}
