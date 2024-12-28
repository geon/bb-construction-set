import { c64BuiltinCharsets } from "./c64-builtin-charsets";
import { PeFileData } from "./pe-file";

export const peFileBuiltinCharsets: PeFileData["charsets"][number][] = [
	{
		name: "C64 uppercase",
		mode: "single",
		bgColor: 6,
		charColor: 14,
		multiColor1: 1,
		multiColor2: 2,
		bitmaps: c64BuiltinCharsets.uppercase,
	},
	{
		name: "C64 lowercase",
		mode: "single",
		bgColor: 6,
		charColor: 14,
		multiColor1: 1,
		multiColor2: 2,
		bitmaps: c64BuiltinCharsets.lowercase,
	},
];
