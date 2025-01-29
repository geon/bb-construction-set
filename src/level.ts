import { CharBlock } from "./charset-char";
import { CharsetChar } from "./charset-char";
import { PaletteIndex } from "./palette";
import { Tuple } from "./tuple";

export const levelWidth = 32;
export const levelHeight = 25;
export const numTiles = levelWidth * levelHeight;

export interface Monster {
	type: number;
	spawnPoint: {
		x: number;
		y: number;
	};
	facingLeft: boolean;
}

// up, right, down, left
export type BubbleCurrentDirection = 0 | 1 | 2 | 3;

type TileRow = Tuple<boolean, 32>;
export type Tiles = Tuple<TileRow, 25>;

export function createTiles(): Tiles {
	return Array(levelHeight)
		.fill(0)
		.map((_) => Array(levelWidth).fill(false)) as Tiles;
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
	monsters: Array<Monster>;
	bubbleCurrentRectangles: BubbleCurrentRectangles;
	bubbleCurrentPerLineDefaults: BubbleCurrentPerLineDefaults;
}

function rowIsSymmetric(row: boolean[]): boolean {
	for (let index = 0; index < 16; ++index) {
		if (row[index] !== row[31 - index]) {
			return false;
		}
	}
	return true;
}

export function levelIsSymmetric(tiles: Tiles) {
	for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
		if (!rowIsSymmetric(tiles[rowIndex])) {
			return false;
		}
	}
	return true;
}
