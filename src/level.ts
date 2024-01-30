import { CharsetChar, parseCharsetCharLine } from "./charset-char";

export const levelWidth = 32;
export const levelHeight = 25;
export const numTiles = levelWidth * levelHeight;

export const maxAsymmetric = 45;
export const maxSidebars = 59;

export interface Monster {
	type: number;
	spawnPoint: {
		x: number;
		y: number;
	};
	facingLeft: boolean;
}

export interface Level {
	// Should be exactly `numTiles` entries.
	tiles: Array<boolean>;
	bgColorLight: number;
	bgColorDark: number;
	platformChar: CharsetChar;
	sidebarChars?: [CharsetChar, CharsetChar, CharsetChar, CharsetChar];
	monsters: Array<Monster>;
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
