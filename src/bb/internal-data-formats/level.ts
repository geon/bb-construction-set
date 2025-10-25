import { CharBlock } from "./char";
import { Char } from "./char";
import { mapTuple, Tuple, MutableTuple } from "../tuple";
import { levelSize } from "../game-definitions/level-size";
import { range } from "../functions";
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

export const platformTilesSize = {
	x: levelSize.x,
	y: levelSize.y,
} as const satisfies Coord2;

type TileRow = Tuple<boolean, typeof platformTilesSize.x>;
export type Tiles = Tuple<TileRow, typeof platformTilesSize.y>;

export function createTiles(): MutableTuple<
	MutableTuple<boolean, typeof platformTilesSize.x>,
	typeof platformTilesSize.y
> {
	return mapTuple(range(platformTilesSize.y), () =>
		mapTuple(range(platformTilesSize.x), () => false)
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
	for (let index = 0; index < platformTilesSize.x / 2; ++index) {
		if (row[index] !== row[platformTilesSize.x - 1 - index]) {
			return false;
		}
	}
	return true;
}

export function levelIsSymmetric(tiles: Tiles) {
	return tiles.slice(1, -1).every(rowIsSymmetric);
}

export function getTiles(level: Level): Tiles {
	return level.tiles;
}
