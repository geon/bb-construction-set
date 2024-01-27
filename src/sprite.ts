export const spriteWidthBytes = 3;
export const spriteHeight = 21;
export const numSpriteBytes = spriteWidthBytes * spriteHeight;

export interface Sprite {
	// Should be exactly numSpriteBytes long.
	bitmap: Array<number>;
}

export type CharacterName =
	| "player"
	| "bubbleBuster"
	| "incendo"
	| "colley"
	| "hullaballoon"
	| "beluga"
	| "willyWhistle"
	| "stoner"
	| "superSocket";

export type Sprites = Record<CharacterName, Sprite[]>;

export const spriteCounts: Record<CharacterName, number> = {
	player: 19,
	bubbleBuster: 12,
	incendo: 12,
	colley: 12,
	hullaballoon: 8,
	beluga: 12,
	willyWhistle: 8,
	stoner: 8,
	superSocket: 6,
};

export const spriteLeftIndex: Record<CharacterName, number> = {
	player: 4,
	bubbleBuster: 4,
	incendo: 4,
	colley: 4,
	hullaballoon: 2,
	beluga: 4,
	willyWhistle: 2,
	stoner: 2,
	superSocket: 1,
};

export const spriteColors: Record<CharacterName, number> = {
	player: 5,
	bubbleBuster: 12,
	incendo: 15,
	colley: 5,
	hullaballoon: 13,
	beluga: 4,
	willyWhistle: 5,
	stoner: 3,
	superSocket: 15,
};
