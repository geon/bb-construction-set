import { Level } from "./level";
import { CharBitmap, PeFileData } from "./pe-file";
import { peFileBuiltinCharsets } from "./pe-file-builtin-charsets";
import { Sprites } from "./sprite";
import { CharsetChar } from "./charset-char";

const emptyChar: CharBitmap = [0, 0, 0, 0, 0, 0, 0, 0];

const shadowCharIndexByName = {
	endUnder: 0 + 2,
	outerCorner: 1 + 2,
	endRight: 2 + 2,
	under: 3 + 2,
	right: 4 + 2,
	innerCorner: 5 + 2,
};
const shadowChars: CharBitmap[] = [
	[
		0b00000000, // Comment to prevent formatting.
		0b01010101, // Comment to prevent formatting.
		0b00010101, // Comment to prevent formatting.
		0b00000101, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
	],
	[
		0b00010100, // Comment to prevent formatting.
		0b01010100, // Comment to prevent formatting.
		0b01010100, // Comment to prevent formatting.
		0b01010100, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
	],
	[
		0b00010000, // Comment to prevent formatting.
		0b00010000, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
	],
	[
		0b00000000, // Comment to prevent formatting.
		0b01010101, // Comment to prevent formatting.
		0b01010101, // Comment to prevent formatting.
		0b01010101, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
		0b00000000, // Comment to prevent formatting.
	],
	[
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
	],
	[
		0b00000000, // Comment to prevent formatting.
		0b00010101, // Comment to prevent formatting.
		0b00010101, // Comment to prevent formatting.
		0b00010101, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
		0b00010100, // Comment to prevent formatting.
	],
];

export function levelsToPeFileData(data: {
	levels: readonly Level[];
	sprites: Sprites;
}): PeFileData {
	const now = new Date().getTime();
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
		charsets: [
			// The builtin charsets are treated differently by PETSCII Editor.
			...peFileBuiltinCharsets,
			...data.levels.map(
				(level, levelIndex): PeFileData["charsets"][number] => ({
					name: "Level " + (levelIndex + 1),
					mode: "multicolor",
					bgColor: 0,
					charColor: 0, // Black to not tempt using it.
					multiColor1: level.bgColorDark,
					multiColor2: level.bgColorLight,
					bitmaps: makeCharsetBitmaps(level),
				})
			),
		],
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
				spriteMultiColor1: 2, // Dark red
				spriteMultiColor2: 1, // White
				spritesInBorder: "hidden",
				spritesVisible: true,
				characterSet: levelIndex + 2, // Take the 2 builtin charsets into account.
				// `charData.length` should match `sizeY` and `charData[n].length` should match `sizeX`.
				charData: makeLevelCharData(level),
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

function makeLevelCharData(level: Level): number[][] {
	const chars = chunk(
		level.tiles.map((tile) => (tile ? 1 : 0) as number),
		32
	).map((row) => padRight(row, 40, 0));

	for (const [indexY, row] of chars.entries()) {
		for (const [indexX, char] of row.entries()) {
			if (indexX >= 32) {
				continue;
			}

			if (char === 1) {
				continue;
			}

			if (indexX > 0 && chars[indexY][indexX - 1] === 1) {
				if (indexY > 0 && chars[indexY - 1][indexX] === 1) {
					chars[indexY][indexX] = shadowCharIndexByName.innerCorner;
					continue;
				}
				if (indexX > 0 && indexY > 0 && chars[indexY - 1][indexX - 1] === 1) {
					chars[indexY][indexX] = shadowCharIndexByName.right;
					continue;
				}
				chars[indexY][indexX] = shadowCharIndexByName.endRight;
				continue;
			}

			if (indexY > 0 && chars[indexY - 1][indexX] === 1) {
				if (indexX > 0 && indexY > 0 && chars[indexY - 1][indexX - 1] === 1) {
					chars[indexY][indexX] = shadowCharIndexByName.under;
					continue;
				}

				chars[indexY][indexX] = shadowCharIndexByName.endUnder;
				continue;
			}

			if (indexX > 0 && indexY > 0 && chars[indexY - 1][indexX - 1] === 1) {
				chars[indexY][indexX] = shadowCharIndexByName.outerCorner;
				continue;
			}
		}
	}

	for (let indexY = 0; indexY < 25; ++indexY) {
		const offset = indexY % 2 ? 16 : 0;
		chars[indexY][0] = 16 + offset;
		chars[indexY][1] = 17 + offset;
		chars[indexY][30] = 16 + offset;
		chars[indexY][31] = 17 + offset;
	}

	return chars;
}

function makeCharsetBitmaps(level: Level): CharBitmap[] {
	const platformChar = levelCharToPeChar(level.platformChar);

	const charset = padRight(
		[emptyChar, platformChar, ...shadowChars],
		// `charset.length` should be exactly 256.
		256,
		emptyChar
	);

	const sidebarChars = (level.sidebarChars ?? []).map(levelCharToPeChar);

	charset[16] = sidebarChars[0] ?? platformChar;
	charset[17] = sidebarChars[1] ?? platformChar;
	charset[32] = sidebarChars[2] ?? platformChar;
	charset[33] = sidebarChars[3] ?? platformChar;

	return charset;
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
