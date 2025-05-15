import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import {
	CharSegmentName,
	charSegmentNames,
} from "../game-definitions/char-segment-name";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { mapRecord, objectFromEntries, sum } from "../functions";
import { charGroupMeta } from "./char-groups";

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
	hexagonExplosion: 1,
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
	hexagonExplosion: 0xa854,
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

const itemSegmentLengths = mapRecord(
	charGroupMeta,
	(x) => 8 * x.count * x.width * x.height
);

const mainItemsStartAddress = 0x8f00;
function getItemsStartAddress(itemSegmentName: CharSegmentName): number {
	// Sum up the length of all segments before the wanted one.
	return (
		mainItemsStartAddress +
		sum(
			charSegmentNames
				.slice(
					charSegmentNames.indexOf("baronVonBlubba"),
					charSegmentNames.indexOf(itemSegmentName)
				)
				.map((characterName) => itemSegmentLengths[characterName])
		)
	);
}
export const itemDataSegmentLocations: Readonly<
	Record<CharSegmentName, SegmentLocation>
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
		startAddress: getItemsStartAddress("baronVonBlubba"),
		length: itemSegmentLengths.baronVonBlubba,
	},
	specialBubbles: {
		startAddress: getItemsStartAddress("specialBubbles"),
		length: itemSegmentLengths.specialBubbles,
	},
	lightning: {
		startAddress: getItemsStartAddress("lightning"),
		length: itemSegmentLengths.lightning,
	},
	fire: {
		startAddress: getItemsStartAddress("fire"),
		length: itemSegmentLengths.fire,
	},
	extendBubbles: {
		startAddress: getItemsStartAddress("extendBubbles"),
		length: itemSegmentLengths.extendBubbles,
	},
	stonerWeapon: {
		startAddress: getItemsStartAddress("stonerWeapon"),
		length: itemSegmentLengths.stonerWeapon,
	},
	drunkAndInvaderWeapon: {
		startAddress: getItemsStartAddress("drunkAndInvaderWeapon"),
		length: itemSegmentLengths.drunkAndInvaderWeapon,
	},
	incendoWeapon: {
		startAddress: getItemsStartAddress("incendoWeapon"),
		length: itemSegmentLengths.incendoWeapon,
	},
	items: {
		startAddress: getItemsStartAddress("items"),
		length: itemSegmentLengths.items,
	},
	//  (4x4 chars, but only 12 chars are stored.)
	largeLightning: {
		startAddress: getItemsStartAddress("largeLightning"),
		length: itemSegmentLengths.largeLightning,
	},
	bonusRoundCircles: {
		startAddress: getItemsStartAddress("bonusRoundCircles"),
		length: itemSegmentLengths.bonusRoundCircles,
	},
	flowingWater: {
		startAddress: 0x40f8,
		length: itemSegmentLengths.flowingWater,
	},
	fireOnGround: {
		startAddress: 0x4200,
		length: itemSegmentLengths.fireOnGround,
	},
	secretLevelPlatform: {
		startAddress: 0xa668 - 8,
		length: itemSegmentLengths.secretLevelPlatform,
	},
	secretLevelSideDecor: {
		startAddress: 0xa668,
		length: itemSegmentLengths.secretLevelSideDecor,
	},
	secretLevelPedestal: {
		startAddress: 0xa668 + 8 * 4,
		length: itemSegmentLengths.secretLevelPedestal,
	},
	secretLevelPedestalRightEdge: {
		startAddress: 0x9594,
		length: itemSegmentLengths.secretLevelPedestalRightEdge,
	},
	secretLevelPedestalDoor: {
		startAddress: 0xa668 + 8 * 4 + 8 * 7,
		length: itemSegmentLengths.secretLevelPedestalDoor,
	},
	secretLevelBasementDoor: {
		startAddress: 0xa668 + 8 * 4 + 8 * 7 + 8 * 4,
		length: itemSegmentLengths.secretLevelBasementDoor,
	},
};
