import { ReactNode } from "react";
import { BlobDownloadButton } from "./BlobDownloadButton";

export function PrgDownloader({
	prg,
}: {
	readonly prg: ArrayBuffer;
}): ReactNode {
	return (
		<>
			<h2>Save your prg-file</h2>
			<p>
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
				.
			</p>
			<p>
				Drag an unpacked prg onto this{" "}
				<a href={new URL("/pack.bat", import.meta.url).href} download>
					.bat-file
				</a>{" "}
				to pack it for execution.
			</p>
			<BlobDownloadButton
				getBlob={() =>
					new Blob([prg], {
						type: "application/octet-stream",
					})
				}
				label="Save prg"
				fileName="custom bubble bobble.prg"
			/>
		</>
	);
}
