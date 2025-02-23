import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { spriteDataSegmentLocations } from "../bb/prg/data-locations";
import { getDataSegments } from "../bb/prg/io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spriteSegments = getDataSegments(
	readFileSync(__dirname + "/../bb/tests/decompressed-bb.prg").buffer,
	spriteDataSegmentLocations
);

type Export = {
	name: string;
	buffer: Uint8Array;
};

const fileExports = Object.entries(spriteSegments).map(
	([name, segment]): Export => ({
		name,
		buffer: new Uint8Array(segment.buffer).slice(),
	})
);
const dir = __dirname + "/../../bubble bobble sprites";
if (!existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}
for (const fileExport of fileExports) {
	writeFileSync(dir + `/${fileExport.name}.bin`, fileExport.buffer);
}
