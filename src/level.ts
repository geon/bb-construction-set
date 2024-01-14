import { CharsetChar, parseCharsetCharLine } from "./charset-char";

export const levelWidth = 32;
export const levelHeight = 25;
export const numTiles = levelWidth * levelHeight;

export interface Level {
	// Should be exactly `numTiles` entries.
	tiles: Array<boolean>;
	fgColor: number;
	bgColorLight: number;
	bgColorDark: number;
	platformChar: CharsetChar;
}

export function createLevel(): Level {
	return {
		tiles: Array(numTiles).fill(false),
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
	};
}
