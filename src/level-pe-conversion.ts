import { Level, Monster, levelWidth } from "./level";
import { Bit, CharBitmap, PeFileData } from "./pe-file";
import { peFileBuiltinCharsets } from "./pe-file-builtin-charsets";
import {
	CharacterName,
	Sprites,
	spriteColors,
	spriteCounts,
	spriteLeftIndex,
} from "./sprite";
import { CharsetChar, CharsetCharLine } from "./charset-char";

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
				sprites: level.monsters.map(
					(monster): PeFileData["screens"][number]["sprites"][number] => ({
						setId: 0,
						uid: getSpriteUid({
							monsterName: Object.keys(data.sprites)[monster.type + 1],
							facingLeft: monster.facingLeft,
						}),
						x: monster.spawnPoint.x,
						y: monster.spawnPoint.y,
						color: Object.values(spriteColors)[monster.type + 1],
						// palette[Object.values(spriteColors)[monster.type + 1]]
						expandX: false,
						expandY: false,
						priority: "front",
					})
				),
				undoStack: [],
				redoStack: [],
			})
		),
		spriteSets: [
			{
				name: "Characters",
				sprites: Object.entries(data.sprites).flatMap(
					([
						monsterName,
						sprites,
					]): PeFileData["spriteSets"][number]["sprites"][number][] =>
						[false, true].map(
							(
								facingLeft
							): PeFileData["spriteSets"][number]["sprites"][number] => ({
								uid: getSpriteUid({ monsterName, facingLeft }),
								mode: "multicolor",
								colorBg: 0,
								colorSprite:
									monsterName === "player" && facingLeft
										? 3 // Cyan for Bob.
										: spriteColors[monsterName as CharacterName],
								multiColor1: 2,
								multiColor2: 1,
								expandX: false,
								expandY: false,
								bitmapData: sprites[
									facingLeft ? spriteLeftIndex[monsterName as CharacterName] : 0
								].bitmap.map((byte) => [
									isBitSet(byte, 0),
									isBitSet(byte, 1),
									isBitSet(byte, 2),
									isBitSet(byte, 3),
									isBitSet(byte, 4),
									isBitSet(byte, 5),
									isBitSet(byte, 6),
									isBitSet(byte, 7),
								]),
							})
						)
				),
				undoStack: [],
				redoStack: [],
			},
		],
	};
}

function getSpriteUid({
	monsterName,
	facingLeft,
}: {
	monsterName: string;
	facingLeft: boolean;
}): string {
	return monsterName + ":" + (facingLeft ? "left" : "right");
}

function parseSpriteUid(uid: string): {
	monsterName: string;
	facingLeft: boolean;
} {
	const parts = uid.split(":");
	return { monsterName: parts[0], facingLeft: parts[1] === "true" };
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

function isBitSet(byte: number, index: number): Bit {
	return ((byte >> (7 - index)) & 1) as Bit;
}

function rowIsSymmetric(row: boolean[]): boolean {
	for (let index = 0; index < 16; ++index) {
		if (row[index] !== row[31 - index]) {
			return false;
		}
	}
	return true;
}

function levelIsSymmetric(tiles: boolean[]) {
	for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
		if (!rowIsSymmetric(tiles.slice(rowIndex * 32, (rowIndex + 1) * 32))) {
			return false;
		}
	}
	return true;
}

export function peFileDataToLevels(peFileData: PeFileData): Level[] {
	const charsets = peFileData.charsets.map((peCharset) =>
		peCharset.bitmaps.map(
			(bitmap) =>
				({
					lines: bitmap.map(
						(line) =>
							[
								(line >> 6) & 0b11,
								(line >> 4) & 0b11,
								(line >> 2) & 0b11,
								(line >> 0) & 0b11,
							] as CharsetCharLine
					),
				} as CharsetChar)
		)
	);

	const solidTiles = new Set([1, 16, 17, 32, 33]);
	return peFileData.screens.map((screen): Level => {
		const rows = screen.charData.map((row) =>
			row.slice(0, 32).map((char) => solidTiles.has(char))
		);
		const tiles = rows.flat();
		const isSymmetric = levelIsSymmetric(tiles);

		const charset = charsets[screen.characterSet];
		const platformChar = charset[1];
		const sidebarChars: Level["sidebarChars"] = [
			charset[16],
			charset[17],
			charset[32],
			charset[33],
		];

		const monsters = screen.sprites
			.map((sprite): Monster => {
				const { monsterName, facingLeft } = parseSpriteUid(sprite.uid);
				return {
					type: Object.keys(spriteCounts).indexOf(monsterName) - 1,
					spawnPoint: { x: sprite.x, y: sprite.y },
					facingLeft,
				};
			})
			.filter((monster) => monster.type !== -1);

		return {
			tiles,
			isSymmetric,
			bgColorLight: screen.multiColor2,
			bgColorDark: screen.multiColor1,
			platformChar,
			sidebarChars,
			monsters,
		};
	});
}
