import { Level } from "./level";
import { CharBitmap, PeFileData } from "./pe-file";
import { Sprites } from "./sprite";
import { CharsetChar } from "./charset-char";

export function levelsToPeFileData(data: {
	levels: readonly Level[];
	sprites: Sprites;
}): PeFileData {
	const now = new Date().getTime();
	const emptyChar: CharBitmap = [0, 0, 0, 0, 0, 0, 0, 0];

	return {
		app: "PETSCII Editor",
		url: "http://petscii.krissz.hu/",
		meta: {
			name: "Bubble Bobble c64",
			authorName: "",
			editorVersion: "3.0",
			fileFormatVersion: "3.0",
			createTime: now,
			lastSaveTime: now,
		},
		options: {
			palette: "pepto-pal",
			crtFilter: "scanlines",
			fileName: "bubble-bobble-c64",
			saveCounter: 1,
			concatSaveCounter: "yes",
			autosave: "yes",
			autosaveInterval: 10,
			keyboardLayout: "us",
			firstKeydown: "draw",
			firstClick: "draw",
			tooltips: "yes",
			cursorFollow: "yes",
		},
		clipboards: { screenEditor: [], charsetEditor: false, spriteEditor: false },
		charsets: data.levels.map(
			(level, levelIndex): PeFileData["charsets"][number] => ({
				name: "Level " + (levelIndex + 1),
				mode: "multicolor",
				bgColor: 0,
				charColor: 0, // Black to not tempt using it.
				multiColor1: level.bgColorDark,
				multiColor2: level.bgColorLight,
				// `bitmaps.length` should be exactly 256.
				bitmaps: padRight(
					[level.platformChar, ...(level.sidebarChars ?? [])].map(
						levelCharToPeChar
					),
					256,
					emptyChar
				),
			})
		),
		screens: data.levels.map(
			(level, levelIndex): PeFileData["screens"][number] => ({
				name: "Level " + (levelIndex + 1),
				mode: "multicolor",
				sizeX: 40,
				sizeY: 25,
				colorBorder: 0,
				colorBg: 0,
				colorChar: 13, // Multicolor green for bubbles.
				multiColor1: level.bgColorDark,
				multiColor2: level.bgColorLight,
				extBgColor1: 0,
				extBgColor2: 0,
				extBgColor3: 0,
				spriteMultiColor1: 1, // White
				spriteMultiColor2: 2, // Dark red
				spritesInBorder: "hidden",
				spritesVisible: true,
				characterSet: levelIndex,
				// `charData.length` should match `sizeY` and `charData[n].length` should match `sizeX`.
				charData: chunk(level.tiles, 32)
					.map((row) => padRight(row, 40, false))
					.map((row) => row.map((tile) => (tile ? 0 : 20))),
				// Same for colorData.
				// Multicolor green for bubbles.
				colorData: padRight([], 25, padRight([], 40, 13)),
				sprites: [],
				undoStack: [],
				redoStack: [],
			})
		),
		spriteSets: [],
	};
}

function levelCharToPeChar(char: CharsetChar): CharBitmap {
	return char.lines.map((line): CharBitmap[number] =>
		line.reduce<CharBitmap[number]>(
			(soFar, pixel, currentIndex) =>
				soFar + (pixel << ((3 - currentIndex) * 2)),
			0
		)
	) as CharBitmap;
}

function padRight<T>(array: readonly T[], length: number, padding: T): T[] {
	const result = array.slice();
	while (result.length < length) {
		result.push(padding);
	}
	return result;
}

function chunk<T>(array: readonly T[], chunkLength: number): T[][] {
	const chunks: T[][] = [];
	let start = 0;
	do {
		chunks.push(array.slice(start, start + chunkLength));
		start += chunkLength;
	} while (start < array.length);
	return chunks;
}
