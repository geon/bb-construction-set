import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { patchPrg } from "../bb/prg/parse-prg";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import {
	imageDataFromPaletteImage,
	imageDataToBlob,
} from "../bb/image-data/image-data";
import { drawLevel } from "../bb/palette-image/level";
import { doubleImageWidth } from "../bb/palette-image/palette-image";
import { Card } from "./Card";
import { mapAsync, range } from "../bb/functions";
import { Patch } from "../bb/prg/io";
import { ButtonRow } from "./ButtonRow";
import { FileInput } from "./FileInput";

export function FileMenu(props: {
	readonly parsedPrg?: ParsedPrg;
	readonly prg?: ArrayBuffer;
	readonly setPrg: (arrayBuffer: ArrayBuffer) => void;
	readonly manualPatch: Patch;
}): ReactNode {
	const parsedPrg = props.parsedPrg;
	const prg = props.prg;

	return (
		<Card>
			{/* <p>
				Before running your custom prg-file, it needs to be compressed with a
				tool like{" "}
				<a href="https://bitbucket.org/magli143/exomizer/wiki/downloads/exomizer-3.1.2.zip">
				Exomizer
				</a>
				. Drag an unpacked prg onto this{" "}
				<a href={new URL("/pack.bat", import.meta.url).href} download>
				.bat-file
				</a>
				, placed in the same folder as Exomizer to pack it for execution.
				</p> */}

			<ButtonRow>
				<BlobDownloadButton
					getBlob={
						parsedPrg &&
						(async () => {
							return {
								parts: await mapAsync(range(100), async (index) => ({
									fileName: (index + 1).toString().padStart(3, "0") + ".png",
									blob: await imageDataToBlob(
										imageDataFromPaletteImage(
											doubleImageWidth(drawLevel(index, parsedPrg, undefined))
										)
									),
								})),
								fileName: "bubble bobble c64 - all level images.zip",
							};
						})
					}
					label="Save Level Images"
				/>
				<FileInput
					accept={["prg"]}
					onChange={async (file) => props.setPrg(await file.arrayBuffer())}
				>
					Open Prg...
				</FileInput>
				<BlobDownloadButton
					getBlob={
						prg &&
						parsedPrg &&
						(async () => {
							const patched = patchPrg(
								//
								prg,
								parsedPrg,
								props.manualPatch
							);

							return {
								blob: new Blob([patched], {
									type: "application/octet-stream",
								}),
								fileName: "custom bubble bobble.prg",
							};
						})
					}
					label="Save Custom Prg"
				/>
			</ButtonRow>
		</Card>
	);
}
