import { padRight } from "./functions";
import { BubbleCurrentDirection, createTiles, Level, Monster } from "./level";
import { Bit, CharBitmap, createPeFileData, PeFileData } from "./pe-file";
import {
	Sprites,
	characterNames,
	spriteColors,
	spriteCounts,
	spriteLeftIndex,
} from "./sprite";
import { CharsetChar, CharsetCharLine } from "./charset-char";
import { c64BuiltinCharsets } from "./c64-builtin-charsets";
import { PaletteIndex } from "./palette";
import { shadowChars } from "./shadow-chars";

const emptyChar: CharBitmap = [0, 0, 0, 0, 0, 0, 0, 0];

const shadowCharIndexByName = {
	endUnder: 0 + 2,
	outerCorner: 1 + 2,
	endRight: 2 + 2,
	under: 3 + 2,
	right: 4 + 2,
	innerCorner: 5 + 2,
};
// Single color, high res.
// up, right, down, left
const bubbleCurrentChars: Record<BubbleCurrentDirection, CharBitmap> = {
	0: [
		0b00010000, // Comment to prevent formatting.
		0b00111000,
		0b01111100,
		0b111111110,
		0b00111000,
		0b00111000,
		0b00111000,
		0b00000000,
	],
	1: [
		0b00010000, //
		0b00011000,
		0b11111100,
		0b11111110,
		0b11111100,
		0b00011000,
		0b00010000,
		0b00000000,
	],
	2: [
		0b00111000, //
		0b00111000,
		0b00111000,
		0b111111110,
		0b01111100,
		0b00111000,
		0b00010000,
		0b00000000,
	],
	3: [
		0b00010000, //
		0b00110000,
		0b01111110,
		0b11111110,
		0b01111110,
		0b00110000,
		0b00010000,
		0b00000000,
	],
};

const bubbleCurrentRectangleCharsetIndices = {
	"0": 48,
	"1": 49,
	"2": 50,
	"3": 51,
	"4": 52,
	"5": 53,
	"6": 54,
	"7": 55,
	"8": 56,
	"9": 57,
	C: 58,
	S: 59,
};

export function levelsToPeFileData(data: {
	levels: readonly Level[];
	sprites: Sprites;
}): PeFileData {
	return createPeFileData({
		spriteSets: spritesToPeSpriteSets(data.sprites),
		...levelsToPeScreensAndCharsets(data.levels),
	});
}

export function levelsToPeScreensAndCharsets(
	levels: readonly Level[]
): Pick<PeFileData, "screens" | "charsets"> {
	const peFileData: Pick<PeFileData, "screens" | "charsets"> = {
		charsets: [
			// The builtin charsets are treated differently by PETSCII Editor.
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
			...levels.map((level, levelIndex): PeFileData["charsets"][number] => ({
				name: "Level " + (levelIndex + 1),
				mode: "multicolor",
				bgColor: 0,
				charColor: 0, // Black to not tempt using it.
				multiColor1: level.bgColorDark,
				multiColor2: level.bgColorLight,
				bitmaps: makeCharsetBitmaps(level),
			})),
		],
		screens: levels.map((level, levelIndex): PeFileData["screens"][number] => {
			const sizeX = 81;
			const sizeY = 25;
			const { charData, colorData } = makeLevelCharAndColorData(
				level,
				sizeX,
				sizeY
			);

			return {
				name: "Level " + (levelIndex + 1),
				mode: "multicolor",
				sizeX,
				sizeY,
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
				charData,
				colorData,
				sprites: [
					{
						setId: 0,
						uid: getSpriteUid({
							monsterName: "player",
							facingLeft: false,
						}),
						x: 44, // The tail is 6 pixels from the edge.
						y: 221,
						color: 5, // Dark green
						expandX: false,
						expandY: false,
						priority: "front",
					},
					{
						setId: 0,
						uid: getSpriteUid({
							monsterName: "player",
							facingLeft: true,
						}),
						x: 236, // Only 4 pixels from the edge. Not same as pl1.
						y: 221,
						color: 3, // Cyan
						expandX: false,
						expandY: false,
						priority: "front",
					},
					...level.monsters.map(
						(monster): PeFileData["screens"][number]["sprites"][number] => {
							const monsterName = characterNames[monster.type + 1];
							return {
								setId: 0,
								uid: getSpriteUid({
									monsterName,
									facingLeft: monster.facingLeft,
								}),
								x: monster.spawnPoint.x,
								y: monster.spawnPoint.y,
								color: spriteColors[monsterName],
								expandX: false,
								expandY: false,
								priority: "front",
							};
						}
					),
				],
				undoStack: [],
				redoStack: [],
			};
		}),
	};

	return peFileData;
}

export function spritesToPeSpriteSets(
	inputSprites: Sprites
): PeFileData["spriteSets"] {
	const peFileData: PeFileData["spriteSets"] = [
		{
			name: "Characters",
			sprites: characterNames.flatMap(
				(
					monsterName
				): PeFileData["spriteSets"][number]["sprites"][number][] => {
					const sprites = inputSprites[monsterName];
					return [false, true].map(
						(
							facingLeft
						): PeFileData["spriteSets"][number]["sprites"][number] => ({
							uid: getSpriteUid({ monsterName, facingLeft }),
							mode: "multicolor",
							colorBg: 0,
							colorSprite:
								monsterName === "player" && facingLeft
									? 3 // Cyan for Bob.
									: spriteColors[monsterName],
							multiColor1: 2,
							multiColor2: 1,
							expandX: false,
							expandY: false,
							bitmapData: sprites[
								facingLeft ? spriteLeftIndex[monsterName] : 0
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
					);
				}
			),
			undoStack: [],
			redoStack: [],
		},
	];

	return peFileData;
}

function getSpriteUid({
	monsterName,
	facingLeft,
}: {
	monsterName: string;
	facingLeft: boolean;
}): string {
	return monsterName + (facingLeft ? "left" : "right");
}

function parseSpriteUid(uid: string): {
	monsterName: string;
	facingLeft: boolean;
} {
	const facingLeft = uid.endsWith("left");
	const monsterName = uid.substring(0, uid.length - (facingLeft ? 4 : 5));
	return { monsterName, facingLeft };
}

function makeLevelCharAndColorData(
	level: Level,
	sizeX: number,
	sizeY: number
): {
	readonly charData: number[][];
	readonly colorData: number[][];
} {
	// Create canvas.
	const charData: number[][] = Array(sizeY)
		.fill(0)
		.map((_) => padRight([], sizeX, 0));
	const colorData = Array(sizeY)
		.fill(0)
		// Multicolor green for bubbles.
		.map((_) => Array<number>(sizeX).fill(13));

	// Draw the platforms.
	for (const [tileY, row] of level.tiles.entries()) {
		for (const [tileX, tile] of row.entries()) {
			charData[tileY][tileX] = tile ? 1 : 0;
		}
	}

	// Draw the shadows.
	for (const [indexY, row] of charData.entries()) {
		for (const [indexX, char] of row.entries()) {
			if (indexX >= 32) {
				continue;
			}

			if (char === 1) {
				continue;
			}

			if (indexX > 0 && charData[indexY][indexX - 1] === 1) {
				if (indexY > 0 && charData[indexY - 1][indexX] === 1) {
					charData[indexY][indexX] = shadowCharIndexByName.innerCorner;
					continue;
				}
				if (
					indexX > 0 &&
					indexY > 0 &&
					charData[indexY - 1][indexX - 1] === 1
				) {
					charData[indexY][indexX] = shadowCharIndexByName.right;
					continue;
				}
				charData[indexY][indexX] = shadowCharIndexByName.endRight;
				continue;
			}

			if (indexY > 0 && charData[indexY - 1][indexX] === 1) {
				if (
					indexX > 0 &&
					indexY > 0 &&
					charData[indexY - 1][indexX - 1] === 1
				) {
					charData[indexY][indexX] = shadowCharIndexByName.under;
					continue;
				}

				charData[indexY][indexX] = shadowCharIndexByName.endUnder;
				continue;
			}

			if (indexX > 0 && indexY > 0 && charData[indexY - 1][indexX - 1] === 1) {
				charData[indexY][indexX] = shadowCharIndexByName.outerCorner;
				continue;
			}
		}
	}

	// Draw the 2x2 char sidebar tiles.
	for (let indexY = 0; indexY < 25; ++indexY) {
		const offset = indexY % 2 ? 16 : 0;
		charData[indexY][0] = 16 + offset;
		charData[indexY][1] = 17 + offset;
		charData[indexY][30] = 16 + offset;
		charData[indexY][31] = 17 + offset;
	}

	// Draw the bubble currents.
	// Wind colors. All single-color/hight-res.
	const windColors = {
		explicit: 3, // Cyan
		explicitPlatform: 1, // White
		implicit: 6, // Dark blue
		implicitPlatform: 4, // Purple
		reflected: 2, // Red
		reflectedPlatform: 7, // Yellow
	};
	const bubblePlatformsOffset = 33;
	for (const [tileY, row] of level.tiles.entries()) {
		const perLineDefaultCurrent =
			level.bubbleCurrentPerLineDefaults[tileY] + 12;
		charData[tileY][66] = perLineDefaultCurrent;
		colorData[tileY][66] = windColors.explicit;

		// Copy of platforms for easier orientation.
		for (const [tileX, tile] of row.entries()) {
			charData[tileY][tileX + bubblePlatformsOffset] = perLineDefaultCurrent;
			colorData[tileY][tileX + bubblePlatformsOffset] = tile
				? windColors.implicitPlatform
				: windColors.implicit;
		}
	}
	// Draw bubble current rectangles.
	const platformAndSidebarChars = new Set([1, 16, 17, 32, 33]);
	if (level.bubbleCurrentRectangles.type === "rectangles") {
		for (const rectangle of level.bubbleCurrentRectangles.rectangles) {
			if (rectangle.type === "rectangle") {
				if (
					rectangle.top + rectangle.height > 25 ||
					rectangle.left + rectangle.width > 32
				) {
					console.log("Bad rectangle:", rectangle);
					break;
				}
				for (let y = rectangle.top; y < rectangle.top + rectangle.height; ++y) {
					for (
						let x = rectangle.left;
						x < rectangle.left + rectangle.width;
						++x
					) {
						charData[y][x + bubblePlatformsOffset] = rectangle.direction + 12;
						const hasPlatform = platformAndSidebarChars.has(charData[y][x]);
						colorData[y][x + bubblePlatformsOffset] = hasPlatform
							? windColors.explicitPlatform
							: windColors.explicit;
					}
				}
			} else {
				const reflectedArrows = {
					12: 12,
					13: 15,
					14: 14,
					15: 13,
				};
				for (let y = 0; y < 25; ++y) {
					for (let x = 0; x < 16; ++x) {
						charData[y][31 - x + bubblePlatformsOffset] =
							reflectedArrows[
								charData[y][x + bubblePlatformsOffset] as 12 | 13 | 14 | 15
							];
						const hasPlatform = platformAndSidebarChars.has(
							charData[y][31 - x]
						);
						colorData[y][31 - x + bubblePlatformsOffset] = hasPlatform
							? windColors.reflectedPlatform
							: windColors.reflected;
					}
				}
			}
		}
	}

	// Encode the rectangles in plaintext.
	const cursor = { row: 0, col: 0 };
	function print(charsetIndices: readonly number[]): void {
		const white = 1;
		for (const charsetIndex of charsetIndices) {
			if (cursor.col >= sizeX || cursor.row >= sizeY) {
				console.log("Bad print:", cursor);
				break;
			}

			charData[cursor.row][68 + cursor.col] = charsetIndex;
			colorData[cursor.row][68 + cursor.col] = white;
			cursor.col++;
		}
		++cursor.row;
		cursor.col = 0;
	}
	function charToCharsetIndex(char: string) {
		return (
			bubbleCurrentRectangleCharsetIndices[
				char as keyof typeof bubbleCurrentRectangleCharsetIndices
			] ?? 0
		);
	}
	if (level.bubbleCurrentRectangles.type === "copy") {
		print(
			Array.from(
				"C " + level.bubbleCurrentRectangles.levelIndex.toString()
			).map(charToCharsetIndex)
		);
	} else {
		for (const rectangle of level.bubbleCurrentRectangles.rectangles) {
			if (rectangle.type === "symmetry") {
				print([charToCharsetIndex("S")]);
			} else {
				print([
					rectangle.direction + 12,
					charToCharsetIndex(" "),
					...Array.from(
						[rectangle.left, rectangle.top, rectangle.width, rectangle.height]
							.map((num) => num.toString())
							.join(" ")
					).map(charToCharsetIndex),
				]);
			}
		}
	}

	return { charData, colorData };
}

function makeCharsetBitmaps(level: Level): CharBitmap[] {
	const platformChar = levelCharToPeChar(level.platformChar);

	const charset = padRight(
		[
			emptyChar,
			platformChar,
			...shadowChars.originalC64,
			...Array<CharBitmap>(4).fill(emptyChar),
			...Object.values(bubbleCurrentChars),
		],
		// `charset.length` should be exactly 256.
		256,
		emptyChar
	);

	const sidebarChars = (level.sidebarChars ?? []).map(levelCharToPeChar);

	charset[16] = sidebarChars[0] ?? platformChar;
	charset[17] = sidebarChars[1] ?? platformChar;
	charset[32] = sidebarChars[2] ?? platformChar;
	charset[33] = sidebarChars[3] ?? platformChar;

	const currentIndices = Object.values(bubbleCurrentRectangleCharsetIndices);
	for (const index of currentIndices.slice(0, -2)) {
		charset[index] = c64BuiltinCharsets.uppercase[index];
	}
	for (const [index, value] of [3, 19].entries()) {
		charset[currentIndices[currentIndices.length - 2] + index] =
			c64BuiltinCharsets.uppercase[value];
	}

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

function isBitSet(byte: number, index: number): Bit {
	return ((byte >> (7 - index)) & 1) as Bit;
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
		const tiles = createTiles();
		for (const [tileY, row] of tiles.entries()) {
			for (const tileX of row.keys()) {
				tiles[tileY][tileX] = solidTiles.has(screen.charData[tileY][tileX]);
			}
		}

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

		const arrowChars = new Set([12, 13, 14, 15]);
		return {
			tiles,
			bgColorLight: screen.multiColor2 as PaletteIndex,
			bgColorDark: screen.multiColor1 as PaletteIndex,
			platformChar,
			sidebarChars: sidebarChars.some((char) =>
				char.lines.some((line, lineIndex) =>
					line.some(
						(pixel, pixelIndex) =>
							pixel !== platformChar.lines[lineIndex][pixelIndex]
					)
				)
			)
				? sidebarChars
				: undefined,
			monsters,
			bubbleCurrentRectangles: {
				type: "rectangles",
				rectangles: [
					// TODO: Find rectangles in charData.
				],
			},
			bubbleCurrentPerLineDefaults: screen.charData.map((row) =>
				arrowChars.has(row[33]) ? ((row[33] - 12) as BubbleCurrentDirection) : 0
			),
		};
	});
}
