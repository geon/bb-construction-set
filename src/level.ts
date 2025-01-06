import { CharBlock } from "./charset-char";
import { CharsetChar } from "./charset-char";
import { PaletteIndex } from "./palette";

export const levelWidth = 32;
export const levelHeight = 25;
export const numTiles = levelWidth * levelHeight;

export const maxAsymmetric = 45;
export const maxSidebars = 59;
export const maxMonsters = 572;

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

type TileRow = [
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean
];

export type Tiles = [
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow,
	TileRow
];

export function createTiles(): Tiles {
	return Array(levelHeight)
		.fill(0)
		.map((_) => Array(levelWidth).fill(false)) as Tiles;
}

export interface Level {
	// Should be exactly `levelHeight` rows of `levelWidth` tiles each .
	tiles: Tiles;
	bgColorLight: PaletteIndex;
	bgColorDark: PaletteIndex;
	platformChar: CharsetChar;
	sidebarChars: CharBlock | undefined;
	monsters: Array<Monster>;
	bubbleCurrents: {
		// The default bubble current direction for each tile row, so lenght = levelHeight.
		// Stores all 25 rows.
		perLineDefaults: Array<BubbleCurrentDirection>;
	};
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
