import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { parsePrg } from "../bb/parse-prg";
import { serializePeFileData } from "../bb/pe-file";
import { levelsToPeFileData } from "../bb/level-pe-conversion";
import { Level } from "../bb/level";
import { Sprites } from "../bb/sprite";
import { fileURLToPath } from "url";
import path from "path";
import { chunk } from "../bb/functions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parsedPrg = parsePrg(
	readFileSync(__dirname + "/../tests/decompressed-bb.prg").buffer
);

type Export = {
	name: string;
	data: {
		levels: readonly Level[];
		sprites: Sprites;
	};
};

const chunkSize = 10;
const fileExports: Export[] = [
	{
		name: `all levels`,
		data: parsedPrg,
	},
	...chunk(parsedPrg.levels, chunkSize).map(
		(levels, index): Export => ({
			name: `levels ${index * chunkSize + 1}-${(index + 1) * chunkSize}`,
			data: { ...parsedPrg, levels },
		})
	),
];

const dir = __dirname + "/../../bubble bobble levels";
if (!existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

for (const fileExport of fileExports) {
	const peFileData = levelsToPeFileData(fileExport.data);
	writeFileSync(
		dir + `/${fileExport.name}.pe`,
		serializePeFileData(peFileData)
	);
}
