import { Player } from "../internal-data-formats/level";

export const monsterNames = [
	"bubbleBuster",
	"incendo",
	"colley",
	"hullaballoon",
	"beluga",
	"willyWhistle",
	"stoner",
	"superSocket",
] as const;

export const characterNames = ["player", ...monsterNames] as const;

export type CharacterName = (typeof characterNames)[number];

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

export const pl1: Player = {
	spawnPoint: {
		x: 44, // The tail is 6 pixels from the edge.
		y: 221,
	},
	characterName: "player",
	facingLeft: false,
};

export const pl2: Player = {
	spawnPoint: {
		x: 236, // Only 4 pixels from the edge. Not same as pl1.
		y: 221,
	},
	characterName: "player",
	facingLeft: true,
};
