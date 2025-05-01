import { CharBlock } from "./charset-char";
import { CharsetChar } from "./charset-char";
import { PaletteIndex } from "./palette";
import { assertTuple, mapTuple, ReadonlyTuple, Tuple } from "../tuple";
import { levelHeight, levelWidth } from "../game-definitions/level-size";
import { range } from "../functions";
import { CharName } from "../game-definitions/char-name";
import {
	ShadowStyle,
	peCharToLevelChar,
	shadowChars,
} from "../prg/shadow-chars";
import { CharBitmap } from "../pe/pe-file";
import { CharacterName } from "../game-definitions/character-name";
import { Coord2 } from "../../math/coord2";

export interface Character {
	characterName: CharacterName;
	spawnPoint: Coord2;
	facingLeft: boolean;
}

// up, right, down, left
export type BubbleCurrentDirection = 0 | 1 | 2 | 3;

type TileRow = ReadonlyTuple<boolean, 32>;
export type Tiles = ReadonlyTuple<TileRow, 25>;

export function createTiles(): Tuple<Tuple<boolean, 32>, 25> {
	return mapTuple(range(0, levelHeight), () =>
		mapTuple(range(0, levelWidth), () => false)
	);
}

export type BubbleCurrentPerLineDefaults = Array<BubbleCurrentDirection>;

export interface BubbleCurrentRectangle {
	left: number;
	top: number;
	width: number;
	height: number;
	direction: BubbleCurrentDirection;
}

export type BubbleCurrentRectangleOrSymmetry =
	| {
			readonly type: "symmetry";
	  }
	| ({
			readonly type: "rectangle";
	  } & BubbleCurrentRectangle);

export type BubbleCurrentRectangles =
	| {
			readonly type: "copy";
			readonly levelIndex: number;
	  }
	| {
			readonly type: "rectangles";
			readonly rectangles: readonly BubbleCurrentRectangleOrSymmetry[];
	  };

export interface Level {
	// Should be exactly `levelHeight` rows of `levelWidth` tiles each .
	tiles: Tiles;
	bgColorLight: PaletteIndex;
	bgColorDark: PaletteIndex;
	platformChar: CharsetChar;
	sidebarChars: CharBlock | undefined;
	monsters: Array<Character>;
	bubbleCurrentRectangles: BubbleCurrentRectangles;
	bubbleCurrentPerLineDefaults: BubbleCurrentPerLineDefaults;
}

function rowIsSymmetric(row: readonly boolean[]): boolean {
	for (let index = 0; index < 16; ++index) {
		if (row[index] !== row[31 - index]) {
			return false;
		}
	}
	return true;
}

export function levelIsSymmetric(tiles: Tiles) {
	for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
		if (!rowIsSymmetric(tiles[rowIndex]!)) {
			return false;
		}
	}
	return true;
}

export function levelToCharNames(
	level: Level
): ReadonlyTuple<
	ReadonlyTuple<CharName, typeof levelWidth>,
	typeof levelHeight
> {
	// Create canvas.
	const chars: CharName[][] = range(0, levelHeight).map(() =>
		range(0, levelWidth).map(() => "empty")
	);

	// Draw the platforms.
	for (const [tileY, row] of level.tiles.entries()) {
		for (const [tileX, tile] of row.entries()) {
			chars[tileY]![tileX]! = tile ? "platform" : "empty";
		}
	}

	// Draw the shadows.
	for (const [indexY, row] of chars.entries()) {
		for (const [indexX, char] of row.entries()) {
			if (indexX >= 32) {
				continue;
			}

			if (char === "platform") {
				continue;
			}

			if (indexX > 0 && chars[indexY]![indexX - 1]! === "platform") {
				if (indexY > 0 && chars[indexY - 1]![indexX]! === "platform") {
					chars[indexY]![indexX]! = "shadowInnerCorner";
					continue;
				}
				if (
					indexX > 0 &&
					indexY > 0 &&
					chars[indexY - 1]![indexX - 1]! === "platform"
				) {
					chars[indexY]![indexX]! = "shadowRight";
					continue;
				}
				chars[indexY]![indexX]! = "shadowEndRight";
				continue;
			}

			if (indexY > 0 && chars[indexY - 1]![indexX]! === "platform") {
				if (
					indexX > 0 &&
					indexY > 0 &&
					chars[indexY - 1]![indexX - 1]! === "platform"
				) {
					chars[indexY]![indexX]! = "shadowUnder";
					continue;
				}

				chars[indexY]![indexX]! = "shadowEndUnder";
				continue;
			}

			if (
				indexX > 0 &&
				indexY > 0 &&
				chars[indexY - 1]![indexX - 1]! === "platform"
			) {
				chars[indexY]![indexX]! = "shadowOuterCorner";
				continue;
			}
		}
	}

	// Draw the 2x2 char sidebar tiles.
	for (let indexY = 0; indexY < 25; ++indexY) {
		const left = indexY % 2 ? "sideBorderBottomLeft" : "sideBorderTopLeft";
		const right = indexY % 2 ? "sideBorderBottomRight" : "sideBorderTopRight";

		chars[indexY]![0]! = left;
		chars[indexY]![1]! = right;
		chars[indexY]![30]! = left;
		chars[indexY]![31]! = right;
	}

	return assertTuple(
		chars.map((x) => assertTuple(x, levelWidth)),
		levelHeight
	);
}

export function makeCharset(
	level: Level,
	shadowStyle: ShadowStyle
): Readonly<Record<CharName, CharsetChar>> {
	const emptyChar: CharBitmap = [0, 0, 0, 0, 0, 0, 0, 0];

	return {
		empty: peCharToLevelChar(emptyChar),
		platform: level.platformChar,
		sideBorderTopLeft: level.sidebarChars?.[0] ?? level.platformChar,
		sideBorderTopRight: level.sidebarChars?.[1] ?? level.platformChar,
		sideBorderBottomLeft: level.sidebarChars?.[2] ?? level.platformChar,
		sideBorderBottomRight: level.sidebarChars?.[3] ?? level.platformChar,
		shadowEndUnder: peCharToLevelChar(shadowChars[shadowStyle][0]),
		shadowOuterCorner: peCharToLevelChar(shadowChars[shadowStyle][1]),
		shadowEndRight: peCharToLevelChar(shadowChars[shadowStyle][2]),
		shadowUnder: peCharToLevelChar(shadowChars[shadowStyle][3]),
		shadowRight: peCharToLevelChar(shadowChars[shadowStyle][4]),
		shadowInnerCorner: peCharToLevelChar(shadowChars[shadowStyle][5]),
	};
}
