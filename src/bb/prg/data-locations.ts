import { sum } from "../functions";
import { characterNames, spriteCounts } from "../sprite";

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

export const levelDataSegmentNames = [
	"symmetry",
	"sidebarCharsIndex",
	"bitmaps",
	"platformChars",
	"bgColors",
	"sidebarChars",
	"holeMetadata",
	"monsters",
	"windCurrents",
	"shadowChars",
] as const;
export type LevelDataSegmentName = (typeof levelDataSegmentNames)[number];

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

export const spriteDataSegmentNames = [
	"characters",
	"playerInBubble",
	"bossA",
	"bossB",
	"bonusCupCake",
	"bonusMelon",
	"bonusDiamond",
] as const;
export type SpriteDataSegmentName = (typeof spriteDataSegmentNames)[number];
export const spriteDataSegmentLocations: Readonly<
	Record<SpriteDataSegmentName, SegmentLocation>
> = {
	characters: {
		startAddress: 22528,
		length: 64 * sum(Object.values(spriteCounts)),
	},
	playerInBubble: { startAddress: 0x7440, length: 64 * 8 },
	bossA: { startAddress: 0x7640, length: 64 * 18 },
	bossB: { startAddress: 0x7c40, length: 64 * 9 },
	bonusCupCake: { startAddress: 0xa320, length: 64 * 4 },
	bonusMelon: { startAddress: 0xa420, length: 64 * 4 },
	bonusDiamond: { startAddress: 0xa520, length: 64 * 2 },

	// playerInBubble: { startAddress: 0x7440, length: 64 * 8 },
	// bossLeft: { startAddress: 0x7640, length: 64 * 9 },
	// bossInBubble: { startAddress: 0x7880, length: 64 * 9 },
	// bossRight: { startAddress: 0x7c40, length: 64 * 9 },
	// bonusCupCake: { startAddress: 0xa320, length: 64 * 4 },
	// bonusMelon: { startAddress: 0xa4a0, length: 64 * 2 },
	// bonusDiamond: { startAddress: 0xa520, length: 64 * 2 },
};
export const monsterSpriteColorsSegmentLocation: SegmentLocation = {
	startAddress: 0xab63,
	length: characterNames.slice(1).length, // 8. The player color is not included.
};

export const itemDataSegmentNames = [
	"bubbleBlow",
	"bubblePop",
	// "rest",
	"baronVonBlubba",
	"specialBubbles",
	"lightning",
	"fire",
	"extendBubbles",
	"stonerWeapon",
	"drunkAndInvaderWeapon",
	"incendoWeapon",
	"items",
	"largeLightning",
	"bonusRoundCircles",
] as const;
export type ItemDataSegmentName = (typeof itemDataSegmentNames)[number];
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
	// rest: {
	// 	startAddress: 0x8f00,
	// 	length: 4 * 8 * 161,
	// },
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
