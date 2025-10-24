import { CharBlock } from "./char";
import { Char } from "./char";
import { assertTuple, mapTuple, Tuple, MutableTuple } from "../tuple";
import { levelSize } from "../game-definitions/level-size";
import { range } from "../functions";
import { CharName } from "../game-definitions/char-name";
import { ShadowChars } from "../prg/shadow-chars";
import { Coord2 } from "../../math/coord2";
import { Rect } from "../../math/rect";
import { BgColors } from "./bg-colors";
import { PerLevelBubbleSpawns } from "./bubble-spawns";
import { PerLevelItemSpawnPositions } from "./item-spawn-positions";
import { CharacterName } from "../game-definitions/character-name";
import { LevelIndex } from "./levels";

interface Character<TCharacterName> {
	readonly characterName: TCharacterName;
	readonly spawnPoint: Coord2;
	readonly facingLeft: boolean;
}

export type Monster = Character<Exclude<CharacterName, "player">>;
export type Player = Character<Extract<CharacterName, "player">>;

// up, right, down, left
export type BubbleCurrentDirection = 0 | 1 | 2 | 3;

export function rotateDirectionClockwise(
	direction: BubbleCurrentDirection
): BubbleCurrentDirection {
	return ((direction + 1) % 4) as BubbleCurrentDirection;
}

export const levelTilesSize = {
	x: levelSize.x,
	y: levelSize.y,
} as const satisfies Coord2;

type TileRow = Tuple<boolean, typeof levelTilesSize.x>;
export type Tiles = Tuple<TileRow, typeof levelTilesSize.y>;

export function createTiles(): MutableTuple<
	MutableTuple<boolean, typeof levelTilesSize.x>,
	typeof levelTilesSize.y
> {
	return mapTuple(range(levelTilesSize.y), () =>
		mapTuple(range(levelTilesSize.x), () => false)
	);
}

export type Holes = Record<"top" | "bottom", Record<"left" | "right", boolean>>;

export type BubbleCurrentPerLineDefaults = Array<BubbleCurrentDirection>;

export interface BubbleCurrentRectangle {
	readonly rect: Rect;
	readonly direction: BubbleCurrentDirection;
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
			readonly levelIndex: LevelIndex;
	  }
	| {
			readonly type: "rectangles";
			readonly rectangles: readonly BubbleCurrentRectangleOrSymmetry[];
	  };

export interface Level {
	readonly tiles: Tiles;
	readonly holes: Holes;
	readonly bgColors: BgColors;
	readonly platformChar: Char;
	readonly sidebarChars: CharBlock | undefined;
	readonly monsters: ReadonlyArray<Monster>;
	readonly bubbleCurrentRectangles: BubbleCurrentRectangles;
	readonly bubbleCurrentPerLineDefaults: BubbleCurrentPerLineDefaults;
	readonly bubbleSpawns: PerLevelBubbleSpawns;
	readonly itemSpawnPositions: PerLevelItemSpawnPositions;
}

function rowIsSymmetric(row: readonly boolean[]): boolean {
	for (let index = 0; index < levelTilesSize.x / 2; ++index) {
		if (row[index] !== row[levelTilesSize.x - 1 - index]) {
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
): Tuple<Tuple<CharName, typeof levelSize.x>, typeof levelSize.y> {
	// Create canvas.
	const chars: CharName[][] = range(levelSize.y).map(() =>
		range(levelSize.x).map(() => "empty")
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
	for (let indexY = 0; indexY < levelSize.y; ++indexY) {
		const left = indexY % 2 ? "sideBorderBottomLeft" : "sideBorderTopLeft";
		const right = indexY % 2 ? "sideBorderBottomRight" : "sideBorderTopRight";

		chars[indexY]![0]! = left;
		chars[indexY]![1]! = right;
		chars[indexY]![levelSize.x - 2]! = left;
		chars[indexY]![levelSize.x - 1]! = right;
	}

	return assertTuple(
		chars.map((x) => assertTuple(x, levelSize.x)),
		levelSize.y
	);
}

export function makeCharset(
	level: Level,
	shadowChars: ShadowChars
): Readonly<Record<CharName, Char>> {
	const emptyChar: Char = [
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];

	return {
		empty: emptyChar,
		platform: level.platformChar,
		sideBorderTopLeft: level.sidebarChars?.[0] ?? level.platformChar,
		sideBorderTopRight: level.sidebarChars?.[1] ?? level.platformChar,
		sideBorderBottomLeft: level.sidebarChars?.[2] ?? level.platformChar,
		sideBorderBottomRight: level.sidebarChars?.[3] ?? level.platformChar,
		shadowEndUnder: shadowChars[0],
		shadowOuterCorner: shadowChars[1],
		shadowEndRight: shadowChars[2],
		shadowUnder: shadowChars[3],
		shadowRight: shadowChars[4],
		shadowInnerCorner: shadowChars[5],
	};
}
