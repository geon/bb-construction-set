import { Character } from "../internal-data-formats/level";

export const characterNames = [
	"player",
	"bubbleBuster",
	"incendo",
	"colley",
	"hullaballoon",
	"beluga",
	"willyWhistle",
	"stoner",
	"superSocket",
] as const;

export type CharacterName = (typeof characterNames)[number];

export function isCharacterName(text: string): text is CharacterName {
	return characterNames.includes(text as CharacterName);
}

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

export const pl1: Character = {
	spawnPoint: {
		x: 44, // The tail is 6 pixels from the edge.
		y: 221,
	},
	characterName: "player",
	facingLeft: false,
};

export const pl2: Character = {
	spawnPoint: {
		x: 236, // Only 4 pixels from the edge. Not same as pl1.
		y: 221,
	},
	characterName: "player",
	facingLeft: true,
};
