import { CharBlock } from "./charset-char";
import { CharsetChar, parseCharsetCharLine } from "./charset-char";

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

export interface Level {
	// Should be exactly `numTiles` entries.
	tiles: Array<boolean>;
	bgColorLight: number;
	bgColorDark: number;
	platformChar: CharsetChar;
	sidebarChars?: CharBlock;
	monsters: Array<Monster>;
	// The default bubble current direction for each tile row, so lenght = levelHeight.
	bubbleCurrentLineDefault: Array<BubbleCurrentDirection>;
}

export function createLevel(): Level {
	return {
		tiles: Array(numTiles).fill(false),
		bgColorLight: 0,
		bgColorDark: 0,
		platformChar: {
			lines: [
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
				parseCharsetCharLine(0xff),
			],
		},
		monsters: [],
		bubbleCurrentLineDefault: Array(levelHeight).fill(0),
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

export function levelIsSymmetric(tiles: boolean[]) {
	for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
		if (!rowIsSymmetric(tiles.slice(rowIndex * 32, (rowIndex + 1) * 32))) {
			return false;
		}
	}
	return true;
}
