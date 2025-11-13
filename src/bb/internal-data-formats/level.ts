import { Char } from "./char";
import { Coord2, origo } from "../../math/coord2";
import { bottomRight, Rect, rectIntersection } from "../../math/rect";
import { BgColors } from "./bg-colors";
import { PerLevelBubbleSpawns } from "./bubble-spawns";
import { PerLevelItemSpawnPositions } from "./item-spawn-positions";
import { CharacterName } from "../game-definitions/character-name";
import { LevelIndex } from "./levels";
import { MutableTuple, Tuple } from "../tuple";
import { levelSize } from "../game-definitions/level-size";
import { CharBlock } from "./char-block";
import { isDefined, range } from "../functions";

interface Character<TCharacterName> {
	readonly characterName: TCharacterName;
	readonly spawnPoint: Coord2;
	readonly facingLeft: boolean;
	readonly delay: number;
	readonly confirmed_mystery_bits_A_3A1C: number | undefined;
}

export type Monster = Character<Exclude<CharacterName, "player">>;
export type Player = Pick<
	Character<Extract<CharacterName, "player">>,
	"spawnPoint" | "characterName" | "facingLeft"
>;

// up, right, down, left
export type BubbleCurrentDirection = 0 | 1 | 2 | 3;

export function rotateDirectionClockwise(
	direction: BubbleCurrentDirection
): BubbleCurrentDirection {
	return ((direction + 1) % 4) as BubbleCurrentDirection;
}

export const platformTilesSize = {
	// Not including the 4 side borders. 32-4 = 28
	x: 28,
	// Not including the top & bottom. 25-2 = 23
	y: 23,
} as const satisfies Coord2;

export type PlatformTileRow = Tuple<boolean, typeof platformTilesSize.x>;
export type PlatformTiles = Tuple<PlatformTileRow, typeof platformTilesSize.y>;

export type Holes = Record<"top" | "bottom", Record<"left" | "right", boolean>>;

export type BubbleCurrentPerLineDefaults = Tuple<
	BubbleCurrentDirection,
	typeof levelSize.y
>;

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
	readonly platformTiles: PlatformTiles;
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

export function levelIsSymmetric(tiles: PlatformTiles) {
	return tiles.every(rowIsSymmetric);
}

export function rectangleIsInvalid(rectangle: BubbleCurrentRectangle) {
	const br = bottomRight(rectangle.rect);
	return (
		rectangle.rect.pos.y < 0 ||
		rectangle.rect.pos.x < 0 ||
		br.y > levelSize.y ||
		br.x > levelSize.x
	);
}

export function clipRectanglesToLevel(
	rectangles: readonly BubbleCurrentRectangleOrSymmetry[]
): BubbleCurrentRectangleOrSymmetry[] {
	const clip = (rect: Rect) =>
		rectIntersection(rect, { pos: origo, size: levelSize });

	return rectangles
		.map((rectangle) => {
			if (rectangle.type !== "rectangle") {
				return rectangle;
			}

			const clippedRect = clip(rectangle.rect);
			return (
				clippedRect && {
					...rectangle,
					rect: clippedRect,
				}
			);
		})
		.filter(isDefined);
}

type BubbleCurrentDirections = MutableTuple<
	MutableTuple<BubbleCurrentDirection, (typeof levelSize)["x"]>,
	(typeof levelSize)["y"]
>;

export function getBubbleCurrentDirections(
	bubbleCurrentPerLineDefaults: BubbleCurrentPerLineDefaults,
	rectangles: readonly BubbleCurrentRectangleOrSymmetry[]
): BubbleCurrentDirections {
	const reflectedDirections: Record<
		BubbleCurrentDirection,
		BubbleCurrentDirection
	> = {
		0: 0,
		1: 3,
		2: 2,
		3: 1,
	};

	const directions = range(levelSize.y).map(() =>
		range(levelSize.x).map((): BubbleCurrentDirection => 0)
	);

	for (const [y, row] of directions.entries()) {
		const perLineDefaultCurrent = bubbleCurrentPerLineDefaults[y]!;
		for (const [tileX] of row.entries()) {
			directions[y]![tileX]! = perLineDefaultCurrent;
		}
	}

	for (const rectangle of clipRectanglesToLevel(rectangles)) {
		if (rectangle.type === "rectangle") {
			for (
				let y = rectangle.rect.pos.y;
				y < rectangle.rect.pos.y + rectangle.rect.size.y;
				++y
			) {
				for (
					let x = rectangle.rect.pos.x;
					x < rectangle.rect.pos.x + rectangle.rect.size.x;
					++x
				) {
					directions[y]![x] = rectangle.direction;
				}
			}
		} else {
			for (let y = 0; y < levelSize.y; ++y) {
				for (let x = 0; x < levelSize.x / 2; ++x) {
					directions[y]![levelSize.x - 1 - x] =
						reflectedDirections[directions[y]![x]!]!;
				}
			}
		}
	}

	return directions as BubbleCurrentDirections;
}
