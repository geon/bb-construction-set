import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { sum } from "../functions";

export const maxAsymmetric = 45;
export const maxSidebars = 59;
export const maxMonsters = 572;
export const bytesPerMonster = 3;
const monsterStopBytes = 100; // A stop-byte for each level. Boss level has no stored monsters.

const platformCharArrayAddress = 0xc26e;
const sidebarCharArrayAddress = 0xbb0e;
const bgColorMetadataArrayAddress = 0xff30;
const holeMetadataArrayAddress = 0xc58e;
const symmetryMetadataArrayAddress = 0xff94;

const bitmapArrayAddress = 0xc5f2;
const bitmapArrayByteLength = 46 * (100 + maxAsymmetric);

const monsterArrayAddress = 0xae51;
const windCurrentsArrayAddress = 0xb695;

export interface SegmentLocation {
	readonly startAddress: number;
	readonly length: number;
	readonly mask?: number;
}

export const levelSegmentLocations: Readonly<
	Record<LevelDataSegmentName, SegmentLocation>
> = {
	symmetry: {
		startAddress: symmetryMetadataArrayAddress,
		length: 100,
		mask: 0b10000000,
	},
	sidebarCharsIndex: {
		startAddress: symmetryMetadataArrayAddress,
		length: 100,
		mask: 0b01111111,
	},
	bitmaps: {
		startAddress: bitmapArrayAddress,
		length: bitmapArrayByteLength,
	},
	platformChars: {
		startAddress: platformCharArrayAddress,
		length: 800,
	},
	bgColors: {
		startAddress: bgColorMetadataArrayAddress,
		length: 100,
	},
	sidebarChars: {
		startAddress: sidebarCharArrayAddress,
		length: 4 * 8 * maxSidebars,
	},

	holeMetadata: {
		startAddress: holeMetadataArrayAddress,
		length: 100,
	},

	// holes: {
	// 	startAddress: holeMetadataArrayAddress,
	// 	length: 100,
	// 	mask: 0b00001111,
	// },
	// bubbleCurrentInHoles: {
	// 	startAddress: holeMetadataArrayAddress,
	// 	length: 100,
	// 	mask: 0b11110000,
	// },

	monsters: {
		startAddress: monsterArrayAddress,
		length: maxMonsters * bytesPerMonster + monsterStopBytes,
	},
	windCurrents: {
		startAddress: windCurrentsArrayAddress,
		// Determined through experimentation with ts code. Might be wrong.
		length: 1145,
	},
	shadowChars: {
		startAddress: 0x4050,
		length: 6 * 8, // 6 chars of 8 bytes.
	},
};

export const spriteCounts: Record<SpriteGroupName, number> = {
	player: 19,
	bubbleBuster: 12,
	incendo: 12,
	colley: 12,
	hullaballoon: 8,
	beluga: 12,
	willyWhistle: 8,
	stoner: 8,
	superSocket: 6,
	playerInBubble: 8,
	bossFacingLeft: 9,
	bossInBubble: 9,
	bossFacingRight: 9,
	bonusCupCake: 4,
	bonusMelon: 4,
	bonusDiamond: 2,
};

const charactersStartAddress = 22528;

export const spriteDataSegmentLocations: Readonly<
	Record<SpriteGroupName, SegmentLocation>
> = {
	player: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("player"),
		length: 64 * spriteCounts.player,
	},
	bubbleBuster: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("bubbleBuster"),
		length: 64 * spriteCounts.bubbleBuster,
	},
	incendo: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("incendo"),
		length: 64 * spriteCounts.incendo,
	},
	colley: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("colley"),
		length: 64 * spriteCounts.colley,
	},
	hullaballoon: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("hullaballoon"),
		length: 64 * spriteCounts.hullaballoon,
	},
	beluga: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("beluga"),
		length: 64 * spriteCounts.beluga,
	},
	willyWhistle: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("willyWhistle"),
		length: 64 * spriteCounts.willyWhistle,
	},
	stoner: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("stoner"),
		length: 64 * spriteCounts.stoner,
	},
	superSocket: {
		startAddress:
			charactersStartAddress + 64 * getCharacterOffsetInSprites("superSocket"),
		length: 64 * spriteCounts.superSocket,
	},
	playerInBubble: {
		startAddress: 0x7440,
		length: 64 * spriteCounts.playerInBubble,
	},
	bossFacingLeft: {
		startAddress: 0x7640,
		length: 64 * spriteCounts.bossFacingLeft,
	},
	bossInBubble: {
		startAddress: 0x7640 + 64 * 9,
		length: 64 * spriteCounts.bossInBubble,
	},
	bossFacingRight: {
		startAddress: 0x7c40,
		length: 64 * spriteCounts.bossFacingRight,
	},
	bonusCupCake: {
		startAddress: 0xa320,
		length: 64 * spriteCounts.bonusCupCake,
	},
	bonusMelon: { startAddress: 0xa420, length: 64 * spriteCounts.bonusMelon },
	bonusDiamond: {
		startAddress: 0xa520,
		length: 64 * spriteCounts.bonusDiamond,
	},
};
export const monsterSpriteColorsSegmentLocation: SegmentLocation = {
	startAddress: 0xab63,
	length: characterNames.slice(1).length, // 8. The player color is not included.
};

export const itemDataSegmentLocations: Readonly<
	Record<ItemDataSegmentName, SegmentLocation>
> = {
	bubbleBlow: {
		startAddress: 0x8000,
		length: 4 * 8 * 36,
	},
	bubblePop: {
		startAddress: 0x8980,
		length: 4 * 8 * 12,
	},
	baronVonBlubba: {
		startAddress: 0x8f00,
		length: 4 * 8 * 12,
	},
	specialBubbles: {
		startAddress: 0x8f00 + 4 * 8 * 12,
		length: 4 * 8 * 18,
	},
	lightning: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18),
		length: 4 * 8 * 2,
	},
	fire: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2),
		length: 4 * 8 * 12,
	},
	extendBubbles: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12),
		length: 4 * 8 * 30,
	},
	stonerWeapon: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30),
		length: 4 * 8 * 3,
	},
	drunkAndInvaderWeapon: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3),
		length: 4 * 8 * 10,
	},
	incendoWeapon: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10),
		length: 4 * 8 * 8,
	},
	items: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 8),
		length: 4 * 8 * 58,
	},
	//  (4x4 chars, but only 12 chars are stored.)
	largeLightning: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57),
		length: 4 * 8 * 5,
	},
	bonusRoundCircles: {
		startAddress:
			0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57 + 5),
		length: 4 * 8 * 3,
	},
};

function getCharacterOffsetInSprites(characterName: CharacterName): number {
	// Sum up the length of all segments before the wanted one.
	return sum(
		characterNames
			.slice(0, characterNames.indexOf(characterName))
			.map((characterName) => spriteCounts[characterName])
	);
}
