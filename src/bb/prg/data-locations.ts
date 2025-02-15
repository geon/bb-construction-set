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

export const spriteBitmapArrayAddress = 0x5800;

interface ItemCharsLocation {
	readonly address: number;
	readonly numItems: number;
}
export const itemCharsArrays: readonly ItemCharsLocation[] = [
	// Blow bubble animation.
	{
		address: 0x8000,
		numItems: 144 / 4,
	},
	// Bubble pop.2 frames + position.
	{
		address: 0x8980,
		numItems: 12,
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
	},
	// Fire
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2),
		numItems: 12,
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
	},
	// Incendo weapon.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10),
		numItems: 8,
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
	},
	// Bonus round circles.
	{
		address: 0x8f00 + 4 * 8 * (12 + 18 + 2 + 12 + 30 + 3 + 10 + 9 + 57 + 6),
		numItems: 2,
	},
];

export const dataSegmentNames = [
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
export type DataSegmentName = (typeof dataSegmentNames)[number];

interface SegmentLocation {
	readonly startAddress: number;
	readonly length: number;
	readonly mask?: number;
}

export const segmentLocations: Readonly<
	Record<DataSegmentName, SegmentLocation>
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
