import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { mapRecord, objectFromEntries, sum } from "../functions";

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
	playerInBubbleA: 4,
	playerInBubbleB: 4,
	bossFacingLeft: 9,
	bossInBubble: 9,
	bossFacingRight: 9,
	bonusCupCake: 4,
	bonusMelon: 4,
	bonusDiamond: 2,
};

const charactersStartAddress = 22528;
function getCharacterStartAddress(characterName: CharacterName): number {
	// Sum up the length of all segments before the wanted one.
	return (
		charactersStartAddress +
		64 *
			sum(
				characterNames
					.slice(0, characterNames.indexOf(characterName))
					.map((characterName) => spriteCounts[characterName])
			)
	);
}

const spriteSegmentAddresses: Readonly<Record<SpriteGroupName, number>> = {
	...objectFromEntries(
		(
			[
				"player",
				"bubbleBuster",
				"incendo",
				"colley",
				"hullaballoon",
				"beluga",
				"willyWhistle",
				"stoner",
				"superSocket",
			] as const
		).map((name) => [name, getCharacterStartAddress(name)])
	),
	playerInBubbleA: 0x7440,
	playerInBubbleB: 0x7440 + 64 * 4,
	bossFacingLeft: 0x7640,
	bossInBubble: 0x7640 + 64 * 9,
	bossFacingRight: 0x7c40,
	bonusCupCake: 0xa320,
	bonusMelon: 0xa420,
	bonusDiamond: 0xa520,
};

export const spriteDataSegmentLocations: Readonly<
	Record<SpriteGroupName, SegmentLocation>
> = mapRecord(spriteSegmentAddresses, (startAddress, name) => ({
	startAddress,
	length: 64 * spriteCounts[name],
}));

export const monsterSpriteColorsSegmentLocation: SegmentLocation = {
	startAddress: 0xab63,
	length: characterNames.slice(1).length, // 8. The player color is not included.
};

const itemSegmentLengths: Readonly<Record<ItemDataSegmentName, number>> = {
	bubbleBlow: 4 * 8 * 36,
	bubblePop: 4 * 8 * 12,
	baronVonBlubba: 4 * 8 * 12,
	specialBubbles: 4 * 8 * 18,
	lightning: 4 * 8 * 2,
	fire: 4 * 8 * 12,
	extendBubbles: 4 * 8 * 30,
	stonerWeapon: 4 * 8 * 3,
	drunkAndInvaderWeapon: 4 * 8 * 10,
	incendoWeapon: 4 * 8 * 8,
	items: 4 * 8 * 58,
	largeLightning: 4 * 8 * 5,
	bonusRoundCircles: 4 * 8 * 3,
};

export const itemDataSegmentLocations: Readonly<
	Record<ItemDataSegmentName, SegmentLocation>
> = {
	bubbleBlow: {
		startAddress: 0x8000,
		length: itemSegmentLengths.bubbleBlow,
	},
	bubblePop: {
		startAddress: 0x8980,
		length: itemSegmentLengths.bubblePop,
	},
	baronVonBlubba: {
		startAddress: 0x8f00,
		length: itemSegmentLengths.baronVonBlubba,
	},
	specialBubbles: {
		startAddress: 0x8f00 + 4 * 8 * 12,
		length: itemSegmentLengths.specialBubbles,
	},
	lightning: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18),
		length: itemSegmentLengths.lightning,
	},
	fire: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2),
		length: itemSegmentLengths.fire,
	},
	extendBubbles: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12),
		length: itemSegmentLengths.extendBubbles,
	},
	stonerWeapon: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30),
		length: itemSegmentLengths.stonerWeapon,
	},
	drunkAndInvaderWeapon: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3),
		length: itemSegmentLengths.drunkAndInvaderWeapon,
	},
	incendoWeapon: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10),
		length: itemSegmentLengths.incendoWeapon,
	},
	items: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 8),
		length: itemSegmentLengths.items,
	},
	//  (4x4 chars, but only 12 chars are stored.)
	largeLightning: {
		startAddress: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57),
		length: itemSegmentLengths.largeLightning,
	},
	bonusRoundCircles: {
		startAddress:
			0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57 + 5),
		length: itemSegmentLengths.bonusRoundCircles,
	},
};
