import { ReactNode } from "react";
import { patchPrgSpritesBin } from "../bb/prg/parse-prg";
import { FileInput } from "./FileInput";
import { attempt } from "../bb/functions";
import { parseSpriteGroupsFromBin } from "../bb/prg/sprites";

export function SpritesPatcher({
	prg,
	setPrg,
}: {
	readonly prg: ArrayBuffer;
	readonly setPrg: (file: ArrayBuffer | undefined) => void;
}): ReactNode {
	return (
		<>
			<p>
				Save the file generated above, then edit it in SpritePad, save it and
				select it here.
			</p>
			<FileInput
				accept={["bin"]}
				onChange={async (file) => {
					const buffer = await file?.arrayBuffer();

					const parsedSpriteBinData =
						buffer &&
						attempt(() => {
							const parsed = parseSpriteGroupsFromBin(new Uint8Array(buffer));
							return parsed;
						});

					if (parsedSpriteBinData?.type !== "ok") {
						alert(
							`Could not parse bin: ${
								parsedSpriteBinData?.error ?? "No reason."
							}`
						);
						return;
					}

					const patched = patchPrgSpritesBin(prg, parsedSpriteBinData.result);
					setPrg(patched);
				}}
			>
				Choose file
			</FileInput>
		</>
	);
}
