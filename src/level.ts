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
	isSymmetric: boolean;
	fgColor: number;
	bgColorLight: number;
	bgColorDark: number;
	platformChar: CharsetChar;
	sidebarChars?: [CharsetChar, CharsetChar, CharsetChar, CharsetChar];
	monsters: Array<Monster>;
}

export function createLevel(): Level {
	return {
		tiles: Array(numTiles).fill(false),
		isSymmetric: true,
		fgColor: 0,
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
