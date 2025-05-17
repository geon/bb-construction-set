import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";
import { patchPrg } from "../bb/prg/parse-prg";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import { imageDataFromPaletteImage } from "../bb/image-data/image-data";
import { drawLevel } from "../bb/palette-image/level";
import { doubleImageWidth } from "../bb/palette-image/palette-image";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { assertTuple } from "../bb/tuple";

export function PrgDownloader({
	parsedPrg,
	prg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly prg: ArrayBuffer;
}): ReactNode {
	const shadowChars = assertTuple(parsedPrg.chars.shadows.flat().flat(), 6);

	return (
		<>
			<ImageDataCanvas
				imageData={imageDataFromPaletteImage(
					doubleImageWidth(
						drawLevel(parsedPrg.levels[4]!, parsedPrg.sprites, shadowChars)
					)
				)}
			/>
			<br />
			<br />
			{/* <h2>Save your prg-file</h2> */}
			{/* <p>
				Use the tools below to view and patch your prg-file. When you are done,
				you can download the prg-file. You can also resume editing your saved
				prg-file later.
			</p>
			<p>
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
			<BlobDownloadButton
				getBlob={async () => {
					const patched = patchPrg(prg, parsedPrg);

					return {
						blob: new Blob([patched], {
							type: "application/octet-stream",
						}),
						fileName: "custom bubble bobble.prg",
					};
				}}
				label="Save prg"
			/>
		</>
	);
}
