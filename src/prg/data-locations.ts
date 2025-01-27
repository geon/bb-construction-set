import { GetBoundedByte, makeGetBoundedByte } from "./io";
import { GetByte } from "./types";

export const maxAsymmetric = 45;
export const maxSidebars = 59;
export const maxMonsters = 572;

export const platformCharArrayAddress = 0xc26e;
export const sidebarCharArrayAddress = 0xbb0e;
export const bgColorMetadataArrayAddress = 0xff30;
export const holeMetadataArrayAddress = 0xc58e;
export const symmetryMetadataArrayAddress = 0xff94;

export const bitmapArrayAddress = 0xc5f2;
export const bitmapArrayByteLength = 46 * (100 + maxAsymmetric);

export const monsterArrayAddress = 0xae51;
export const windCurrentsArrayAddress = 0xb695;
export const spriteBitmapArrayAddress = 0x5800;
export const itemCharsArrays = [
	// Blow bubble animation.
	{
		address: 0x8000,
		numItems: 144 / 4,
		withMask: true,
	},
	// Bubble pop.2 frames + position.
	{
		address: 0x8980,
		numItems: 12,
		withMask: true,
	},
	// Baron von Blubba.
	{
		address: 0x8f00,
		numItems: 12,
	},
	// Special bubbles: Water, fire, lightning.
	{
		address: 0x8f00 + 4 * 8 * 12,
		numItems: 18,
	},
	// Lightning
	{
		address: 0x8f00 + 4 * 8 * (12 + 18),
		numItems: 2,
		withMask: true,
	},
	// Fire
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2),
		numItems: 12,
		withMask: true,
	},
	// E-X-T-N-D bubbles.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12),
		numItems: 30,
	},
	// Stoner weapon.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30),
		numItems: 3,
	},
	// Willy Whistle/Drunk weapon + Super Socket/Invader weapon.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3),
		numItems: 10,
		withMask: true,
	},
	// Incendo weapon.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10),
		numItems: 8,
		withMask: true,
	},
	// Items
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 8),
		numItems: 58,
	},
	// Large lightning. (4x4 chars, but only 12 chars are stored.)
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57),
		numItems: 6,
		withMask: true,
	},
	// Bonus round circles.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57 + 6),
		numItems: 2,
	},
];

type DataSegmentName =
	| "symmetryMetadata"
	| "bitmaps"
	| "platformChars"
	| "bgColors"
	| "sidebarChars"
	| "holeMetadata"
	| "monsters"
	| "windCurrents";

export type DataSegments = Record<DataSegmentName, GetBoundedByte>;

export function getDataSegments(getByte: GetByte): DataSegments {
	return {
		symmetryMetadata: makeGetBoundedByte({
			getByte,
			startAddress: symmetryMetadataArrayAddress,
			length: 100,
			segmentName: "symmetryMetadata",
		}),
		bitmaps: makeGetBoundedByte({
			getByte,
			startAddress: bitmapArrayAddress,
			length: bitmapArrayByteLength,
			segmentName: "bitmaps",
		}),
		platformChars: makeGetBoundedByte({
			getByte,
			startAddress: platformCharArrayAddress,
			length: 800,
			segmentName: "platformChars",
		}),
		bgColors: makeGetBoundedByte({
			getByte,
			startAddress: bgColorMetadataArrayAddress,
			length: 100,
			segmentName: "bgColors",
		}),
		sidebarChars: makeGetBoundedByte({
			getByte,
			startAddress: sidebarCharArrayAddress,
			length: 4 * 8 * maxSidebars,
			segmentName: "sidebarChars",
		}),
		holeMetadata: makeGetBoundedByte({
			getByte,
			startAddress: holeMetadataArrayAddress,
			length: 100,
			segmentName: "holeMetadata",
		}),
		monsters: makeGetBoundedByte({
			getByte,
			startAddress: monsterArrayAddress,
			length: maxMonsters * 3 + 99, // 3 bytes per monster plus a stop-byte for each level. Boss level has no stored monsters.
			segmentName: "monsters",
		}),
		windCurrents: makeGetBoundedByte({
			getByte,
			startAddress: windCurrentsArrayAddress,
			length: 1487, // TODO: Move to constant.
			segmentName: "windCurrents",
		}),
	};
}
