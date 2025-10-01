import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import {
	charGroupMeta,
	CharSegmentName,
	charSegmentNames,
} from "../game-definitions/char-segment-name";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { LevelDataSegmentName } from "../game-definitions/level-segment-name";
import { mapRecord, objectFromEntries, range, sum } from "../functions";
import { spriteSizeBytes, spriteWidthBytes } from "../../c64/consts";
import { mapTuple } from "../tuple";

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
	bonusMelonTopLeft: 1,
	bonusMelonTopRight: 1,
	bonusMelonBottom: 2,
	bonusDiamond: 2,
	hexagonExplosion: 1,
	boxyExplosion: 1,
};

export const spriteMasks: Partial<
	Record<SpriteGroupName, ReadonlyArray<boolean>>
> = {
	// The last 8 bytes are used.
	bonusMelonTopLeft: mapTuple(range(spriteSizeBytes), (index) =>
		index < spriteSizeBytes - 8 ? false : true
	),
	// The last 9 bytes are used except the last.
	bonusMelonTopRight: mapTuple(range(spriteSizeBytes), (index) =>
		index < spriteSizeBytes - 9 || index == spriteSizeBytes - 1 ? false : true
	),
	// The first 12 lines are used.
	hexagonExplosion: mapTuple(range(spriteSizeBytes), (index) =>
		index >= 12 * spriteWidthBytes ? false : true
	),
	// The first 9 lines are used.
	boxyExplosion: mapTuple(range(spriteSizeBytes), (index) =>
		index >= 9 * spriteWidthBytes ? false : true
	),
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
	bonusMelonTopLeft: 0x35a8 - 64 + 9,
	bonusMelonTopRight: 0xa420 - 64 + 10,
	bonusMelonBottom: 0xa420 + 64 * 2,
	bonusDiamond: 0xa520,
	hexagonExplosion: 0xa854,
	boxyExplosion: 0xa877,
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

export const largeBonusSpriteColorsSegmentLocation: SegmentLocation = {
	startAddress: 0xa81f,
	// [cupcake, melon, yellow diamond, blue diamond, purple diamond]
	length: 5,
};

const charSegmentLengths = mapRecord(
	charGroupMeta,
	(x) => 8 * x.count * x.width * x.height
);

const mainBlockStartAddress = 0x8f00;
function getCharSegmentStartAddress(name: CharSegmentName): number {
	// Sum up the length of all segments before the wanted one.
	return (
		mainBlockStartAddress +
		sum(
			charSegmentNames
				.slice(
					charSegmentNames.indexOf("baronVonBlubba"),
					charSegmentNames.indexOf(name)
				)
				.map((characterName) => charSegmentLengths[characterName])
		)
	);
}
export const charSegmentLocations: Readonly<
	Record<CharSegmentName, SegmentLocation>
> = {
	bubbleBlow: {
		startAddress: 0x8000,
		length: charSegmentLengths.bubbleBlow,
	},
	bubblePop: {
		startAddress: 0x8980,
		length: charSegmentLengths.bubblePop,
	},
	baronVonBlubba: {
		startAddress: getCharSegmentStartAddress("baronVonBlubba"),
		length: charSegmentLengths.baronVonBlubba,
	},
	specialBubbles: {
		startAddress: getCharSegmentStartAddress("specialBubbles"),
		length: charSegmentLengths.specialBubbles,
	},
	lightning: {
		startAddress: getCharSegmentStartAddress("lightning"),
		length: charSegmentLengths.lightning,
	},
	fire: {
		startAddress: getCharSegmentStartAddress("fire"),
		length: charSegmentLengths.fire,
	},
	extendBubbles: {
		startAddress: getCharSegmentStartAddress("extendBubbles"),
		length: charSegmentLengths.extendBubbles,
	},
	stonerWeapon: {
		startAddress: getCharSegmentStartAddress("stonerWeapon"),
		length: charSegmentLengths.stonerWeapon,
	},
	drunkAndInvaderWeapon: {
		startAddress: getCharSegmentStartAddress("drunkAndInvaderWeapon"),
		length: charSegmentLengths.drunkAndInvaderWeapon,
	},
	incendoWeapon: {
		startAddress: getCharSegmentStartAddress("incendoWeapon"),
		length: charSegmentLengths.incendoWeapon,
	},
	items: {
		startAddress: getCharSegmentStartAddress("items"),
		length: charSegmentLengths.items,
	},
	//  (4x4 chars, but only 12 chars are stored.)
	largeLightning: {
		startAddress: getCharSegmentStartAddress("largeLightning"),
		length: charSegmentLengths.largeLightning,
	},
	bonusRoundCircles: {
		startAddress: getCharSegmentStartAddress("bonusRoundCircles"),
		length: charSegmentLengths.bonusRoundCircles,
	},
	flowingWater: {
		startAddress: 0x40f8,
		length: charSegmentLengths.flowingWater,
	},
	fireOnGroundA: {
		startAddress: 0x40e0,
		length: charSegmentLengths.fireOnGroundA,
	},
	fireOnGround: {
		startAddress: 0x4200,
		length: charSegmentLengths.fireOnGround,
	},
	secretLevelPlatform: {
		startAddress: 0xa668 - 8,
		length: charSegmentLengths.secretLevelPlatform,
	},
	secretLevelSideDecor: {
		startAddress: 0xa668,
		length: charSegmentLengths.secretLevelSideDecor,
	},
	secretLevelPedestal: {
		startAddress: 0xa668 + 8 * 4,
		length: charSegmentLengths.secretLevelPedestal,
	},
	secretLevelPedestalDoor: {
		startAddress: 0xa668 + 8 * 4 + 8 * 7,
		length: charSegmentLengths.secretLevelPedestalDoor,
	},
	secretLevelBasementDoor: {
		startAddress: 0xa668 + 8 * 4 + 8 * 7 + 8 * 4,
		length: charSegmentLengths.secretLevelBasementDoor,
	},
	shadows: {
		startAddress: 0x4050,
		// length: 6 * 8, // 6 chars of 8 bytes.
		length: charSegmentLengths.secretLevelBasementDoor,
	},
	fontHurryUp: {
		startAddress: 0xadb1,
		length: charSegmentLengths.fontHurryUp,
	},
	fontLevelNumbers6px: {
		startAddress: 0xad75,
		length: charSegmentLengths.fontLevelNumbers6px,
	},
	fontNumeric: {
		startAddress: 0x4000,
		length: charSegmentLengths.fontNumeric,
	},
	fontFatneck: {
		startAddress: 0x4080,
		length: charSegmentLengths.fontFatneck,
	},
	fontLifeDotLines: {
		startAddress: 0x40e8,
		length: charSegmentLengths.fontLifeDotLines,
	},
	fontAlpha: {
		startAddress: 0x4108,
		length: charSegmentLengths.fontAlpha,
	},
	fontPunctuation: {
		startAddress: 0x41d8,
		length: charSegmentLengths.fontPunctuation,
	},
	fontRuddyHelloThere: {
		startAddress: 0x4210,
		length: charSegmentLengths.fontRuddyHelloThere,
	},
};

export const validItemCategoryNames = ["points", "powerups"] as const;
export type ItemCategoryName = (typeof validItemCategoryNames)[number];
export const itemSegmentLocations: Record<
	ItemCategoryName,
	{
		readonly charBlockIndices: SegmentLocation;
		readonly colorIndices: SegmentLocation;
	}
> = {
	points: {
		charBlockIndices: {
			startAddress: 0xa892,
			length: 47,
		},
		colorIndices: {
			startAddress: 0xa8e4,
			length: 47,
			mask: 0x0f,
		},
	},
	powerups: {
		charBlockIndices: {
			startAddress: 0xa8c1,
			length: 35,
		},
		colorIndices: {
			startAddress: 0xa913,
			length: 35,
			mask: 0x0f,
		},
	},
};

export const enemyDeathBonusItemIndicesSegmentLocation: SegmentLocation = {
	startAddress: 0xa791, // 0xa790 in the code
	length: 6,
};

export type ItemSpawnPositionArrayName = "a" | "b" | "c";
export const itemSpawnPositionsSegmentLocations: Record<
	ItemSpawnPositionArrayName,
	SegmentLocation
> =
	// The 2 coords are stored as 4 5-bit ints, packed into 3 bytes:
	{
		// 5 x points_x, 3 x points_y
		a: { startAddress: 0xb569, length: 100 },
		// 2 x points_y, 5 x powerups_x, 1 x powerups_y
		b: { startAddress: 0xb5cd, length: 100 },
		// 4 x powerups_y, 4 x other purpose
		c: { startAddress: 0xb631, length: 100, mask: 0xf0 },
	};
