import { sum } from "./functions";
import { PaletteIndex } from "./palette";
import { SpriteDataSegmentName } from "./prg/data-locations";
import { Tuple } from "./tuple";

export const spriteWidthBytes = 3;
export const spriteHeight = 21;
export const numSpriteBytes = spriteWidthBytes * spriteHeight;

export interface Sprite {
	readonly bitmap: Tuple<number, 63>;
}

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

export type Sprites = Record<
	CharacterName,
	{
		readonly sprites: Sprite[];
		readonly color: PaletteIndex;
	}
>;

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

export const spriteColors: Record<"player", PaletteIndex> = {
	player: 5,
	// bubbleBuster: 12,
	// incendo: 15,
	// colley: 5,
	// hullaballoon: 13,
	// beluga: 4,
	// willyWhistle: 5,
	// stoner: 3,
	// superSocket: 15,
};

export function getCharacterOffsetInSprites(
	characterName: CharacterName
): number {
	// Sum up the length of all segments before the wanted one.
	return sum(
		characterNames
			.slice(0, characterNames.indexOf(characterName))
			.map((characterName) => spriteCounts[characterName])
	);
}

export const spriteGroupNames = [
	...characterNames,
	"playerInBubble",
	"bossFacingLeft",
	"bossFacingRight",
	"bossInBubble",
	"bonusCupCake",
	"bonusMelon",
	"bonusDiamond",
] as const;

export type SpriteGroupName = (typeof spriteGroupNames)[number];

export const spriteGroupMultiWidths: Record<SpriteGroupName, number> = {
	player: 1,
	bubbleBuster: 1,
	incendo: 1,
	colley: 1,
	hullaballoon: 1,
	beluga: 1,
	willyWhistle: 1,
	stoner: 1,
	superSocket: 1,
	playerInBubble: 2,
	bossFacingLeft: 3,
	bossInBubble: 3,
	bossFacingRight: 3,
	bonusCupCake: 2,
	bonusMelon: 2,
	bonusDiamond: 2,
};

export type SpriteGroupLocation = {
	segmentName: SpriteDataSegmentName;
	startIndex: number;
	length: number;
};

export const spriteGroupLocations: Record<
	SpriteGroupName,
	SpriteGroupLocation
> = {
	player: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("player"),
		length: spriteCounts.player,
	},
	bubbleBuster: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("bubbleBuster"),
		length: spriteCounts.bubbleBuster,
	},
	incendo: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("incendo"),
		length: spriteCounts.incendo,
	},
	colley: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("colley"),
		length: spriteCounts.colley,
	},
	hullaballoon: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("hullaballoon"),
		length: spriteCounts.hullaballoon,
	},
	beluga: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("beluga"),
		length: spriteCounts.beluga,
	},
	willyWhistle: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("willyWhistle"),
		length: spriteCounts.willyWhistle,
	},
	stoner: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("stoner"),
		length: spriteCounts.stoner,
	},
	superSocket: {
		segmentName: "characters",
		startIndex: getCharacterOffsetInSprites("superSocket"),
		length: spriteCounts.superSocket,
	},
	playerInBubble: {
		segmentName: "playerInBubble",
		startIndex: 0,
		length: 8,
	},
	bossFacingLeft: {
		segmentName: "bossA",
		startIndex: 0,
		length: 9,
	},
	bossInBubble: {
		segmentName: "bossA",
		startIndex: 9,
		length: 9,
	},
	bossFacingRight: {
		segmentName: "bossB",
		startIndex: 0,
		length: 9,
	},
	bonusCupCake: {
		segmentName: "bonusCupCake",
		startIndex: 0,
		length: 4,
	},
	bonusMelon: {
		segmentName: "bonusMelon",
		startIndex: 0,
		length: 4,
	},
	bonusDiamond: {
		segmentName: "bonusDiamond",
		startIndex: 0,
		length: 2,
	},
};

export type SpriteGroup = {
	readonly sprites: Sprite[];
	readonly color: PaletteIndex;
};
