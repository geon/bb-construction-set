export const levelWidth = 32;
export const levelHeight = 25;
export const numTiles = levelWidth * levelHeight;

export interface Level {
	// Should be exactly `numTiles` entries.
	tiles: Array<boolean>;
}

export function createLevel(): Level {
	return { tiles: Array(numTiles).fill(false) };
}
