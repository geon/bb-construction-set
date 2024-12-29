import {
	CharBlock,
	CharsetChar,
	CharsetCharLine,
	parseCharsetCharLine,
} from "./charset-char";
import { chunk } from "./functions";
import {
	BubbleCurrentDirection,
	Level,
	Monster,
	levelHeight,
	levelIsSymmetric,
	levelWidth,
	maxAsymmetric,
	maxSidebars,
} from "./level";
import { Sprite, Sprites, numSpriteBytes, spriteCounts } from "./sprite";

function getPrgStartAddress(prg: DataView): number {
	// The prg contains a little endian 16 bit header with the start address. The rest is the raw data.
	return prg.getUint16(0, true);
}

function getPrgByteAtAddress(
	prg: DataView,
	startAddres: number,
	address: number
): number {
	// Skip the header, then start counting at the startAddress.
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	return prg.getUint8(offset);
}

function setPrgByteAtAddress(
	prg: Uint8Array,
	startAddres: number,
	address: number,
	value: number
): number {
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	return (prg[offset] = value);
}

function isBitSet(byte: number, bitIndex: number): boolean {
	return !!(byte & (0b10000000 >> bitIndex));
}

const platformCharArrayAddress = 0xc26e;
const sidebarCharArrayAddress = 0xbb0e;
const bgColorMetadataArrayAddress = 0xff30;
const holeMetadataArrayAddress = 0xc58e;
const symmetryMetadataArrayAddress = 0xff94;
const bitmapArrayAddress = 0xc5f2;
const monsterArrayAddress = 0xae51;

const spriteBitmapArrayAddress = 0x5800;
const itemCharsArrays = [
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

export function parsePrg(prg: DataView): {
	levels: Level[];
	sprites: Sprites;
	items: CharBlock[];
} {
	const startAddres = getPrgStartAddress(prg);
	const getByte = (address: number) =>
		getPrgByteAtAddress(prg, startAddres, address);

	const levels = readLevels(getByte);
	const sprites = readSprites(getByte);
	const items = readItems(getByte);

	return { levels, sprites, items };
}

function readCharsetChar(
	getByte: (address: number) => number,
	address: number
): CharsetChar {
	const lines: CharsetCharLine[] = [];
	for (let i = 0; i < 8; ++i) {
		const line = parseCharsetCharLine(getByte(address + i));
		lines.push(line);
	}
	return { lines: lines as CharsetChar["lines"] };
}

function readCharBlock(
	getByte: (address: number) => number,
	currentSidebarAddress: number
): CharBlock {
	return [
		readCharsetChar(getByte, currentSidebarAddress + 0 * 8),
		readCharsetChar(getByte, currentSidebarAddress + 1 * 8),
		readCharsetChar(getByte, currentSidebarAddress + 2 * 8),
		readCharsetChar(getByte, currentSidebarAddress + 3 * 8),
	];
}

function readItems(getByte: (address: number) => number): CharBlock[] {
	const items: CharBlock[] = [];
	for (const { address, numItems } of itemCharsArrays) {
		for (let itemIndex = 0; itemIndex < numItems; ++itemIndex) {
			items.push(
				unshuffleCharBlock(readCharBlock(getByte, address + itemIndex * 4 * 8))
			);
		}
	}
	return items;
}

function unshuffleCharBlock(block: CharBlock): CharBlock {
	return [block[0], block[2], block[1], block[3]];
}

function readLevels(getByte: (address: number) => number): Array<Level> {
	// TODO: Check the original data size, and verify.

	const levels: Array<Level> = [];
	let addresses = {
		currentBitmapByteAddress: bitmapArrayAddress,
		currentSidebarAddress: sidebarCharArrayAddress,
		currentMonsterAddress: monsterArrayAddress,
	};
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		let level;
		({ level, addresses } = readLevel(getByte, levelIndex, addresses));

		levels.push(level);
	}
	return levels;
}

function readLevel(
	getByte: (address: number) => number,
	levelIndex: number,
	addresses: {
		currentSidebarAddress: number;
		currentBitmapByteAddress: number;
		currentMonsterAddress: number;
	}
) {
	const bgColorMetadata = getByte(bgColorMetadataArrayAddress + levelIndex);
	const holeMetadata = getByte(holeMetadataArrayAddress + levelIndex);
	const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);

	const platformChar = readCharsetChar(
		getByte,
		platformCharArrayAddress + levelIndex * 8
	);

	const bgColorLight = bgColorMetadata & 0b1111;
	const bgColorDark = (bgColorMetadata & 0b11110000) >> 4;

	const { sidebarChars, currentSidebarAddress } = readSidebarChars(
		addresses.currentSidebarAddress,
		symmetryMetadata,
		getByte
	);

	const isSymmetric = isBitSet(symmetryMetadata, 0);

	const { tiles, bubbleCurrentLineDefault, currentBitmapByteAddress } =
		readTilesAndBubbleCurrentLineDefault(
			addresses.currentBitmapByteAddress,
			getByte,
			isSymmetric,
			holeMetadata
		);

	const { monsters, currentMonsterAddress } = readMonstersForLevel(
		addresses.currentMonsterAddress,
		levelIndex,
		getByte
	);

	const level: Level = {
		platformChar,
		bgColorLight,
		bgColorDark,
		sidebarChars,
		tiles,
		bubbleCurrentLineDefault,
		monsters,
	};

	return {
		level,
		addresses: {
			currentSidebarAddress,
			currentBitmapByteAddress,
			currentMonsterAddress,
		},
	};
}

function readSidebarChars(
	currentSidebarAddress: number,
	symmetryMetadata: number,
	getByte: (address: number) => number
) {
	let sidebarChars: Level["sidebarChars"] = undefined;
	if (!isBitSet(symmetryMetadata, 1)) {
		sidebarChars = readCharBlock(getByte, currentSidebarAddress);
		currentSidebarAddress += 4 * 8; // 4 chars of 8 bytes each.
	}
	return { sidebarChars, currentSidebarAddress };
}

function readTilesAndBubbleCurrentLineDefault(
	currentBitmapByteAddress: number,
	getByte: (address: number) => number,
	isSymmetric: boolean,
	holeMetadata: number
) {
	const tiles = readTileBitmap(
		currentBitmapByteAddress,
		getByte,
		isSymmetric,
		holeMetadata
	);
	currentBitmapByteAddress += (isSymmetric ? 2 : 4) * 23; // 23 lines of 2 or 4 bytes.

	const bubbleCurrentLineDefault = extractbubbleCurrentLineDefault(tiles);

	// Fill in the sides.
	// The 2 tile wide left and right borders are used to store part of the bubbleCurrent.
	// It needs to be set to true to be solid.
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Offset by 32 for the top line.
		tiles[32 + rowIndex * levelWidth] = true;
		tiles[32 + rowIndex * levelWidth + 1] = true;
		tiles[32 + (rowIndex + 1) * levelWidth - 2] = true;
		tiles[32 + (rowIndex + 1) * levelWidth - 1] = true;
	}

	return { tiles, bubbleCurrentLineDefault, currentBitmapByteAddress };
}

function readMonstersForLevel(
	currentMonsterAddress: number,
	levelIndex: number,
	getByte: (address: number) => number
) {
	// Level 100 is the boss level. It has no monsters.
	const monsters: Monster[] = [];
	if (levelIndex !== 99) {
		do {
			monsters.push(readMonster(currentMonsterAddress, getByte));
			currentMonsterAddress += 3;
		} while (getByte(currentMonsterAddress)); // The monsters of each level are separated with a zero byte.
		currentMonsterAddress += 1;
	}
	return { monsters, currentMonsterAddress };
}

function setTileBitmapTopAndBottom(
	tiles: Array<boolean>,
	{
		topLeft,
		topRight,
		bottomLeft,
		bottomRight,
	}: Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight", boolean>
) {
	for (let x = 0; x < levelWidth; ++x) {
		tiles[x] = true;
		tiles[(levelHeight - 1) * levelWidth + x] = true;
	}
	// Cut out the holes.
	for (let x = 0; x < 4; ++x) {
		if (topLeft) {
			tiles[9 + x] = false;
		}
		if (topRight) {
			tiles[19 + x] = false;
		}
		if (bottomLeft) {
			tiles[768 + 9 + x] = false;
		}
		if (bottomRight) {
			tiles[768 + 19 + x] = false;
		}
	}
}

function readTileBitmap(
	currentBitmapByteAddress: number,
	getByte: (address: number) => number,
	isSymmetric: boolean,
	holeMetadata: number
): Array<boolean> {
	const tiles: Array<boolean> = [];

	// Top and bottom rows with holes.
	setTileBitmapTopAndBottom(tiles, {
		topLeft: isBitSet(holeMetadata, 7),
		topRight: isBitSet(holeMetadata, 6),
		bottomLeft: isBitSet(holeMetadata, 5),
		bottomRight: isBitSet(holeMetadata, 4),
	});

	const bytesPerRow = 4;
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Read half or full lines from the level data.
		const bytesToRead = isSymmetric ? bytesPerRow / 2 : bytesPerRow;
		for (
			let bitmapByteOfRowIndex = 0;
			bitmapByteOfRowIndex < bytesToRead;
			++bitmapByteOfRowIndex
		) {
			const bitmapByteIndex = rowIndex * bytesPerRow + bitmapByteOfRowIndex;
			const bitmapByte = getByte(currentBitmapByteAddress);
			currentBitmapByteAddress += 1;
			// Convert the bitmap to an array of bools.
			for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
				// Offset by 32 for the top line.
				tiles[32 + bitmapByteIndex * 8 + bitIndex] = isBitSet(
					bitmapByte,
					bitIndex
				);
			}
		}
		if (isSymmetric) {
			// Mirror the left half to the right half.
			// Offset by 32 for the top line.
			const tileRowStartIndex = 32 + rowIndex * bytesPerRow * 8;
			const tilesPerHalfRow = (bytesPerRow / 2) * 8;
			for (
				let halfRowIndex = 0;
				halfRowIndex < tilesPerHalfRow;
				++halfRowIndex
			) {
				tiles[tileRowStartIndex + tilesPerHalfRow + halfRowIndex] =
					tiles[tileRowStartIndex + tilesPerHalfRow - halfRowIndex - 1];
			}
		}
	}

	return tiles;
}

function extractbubbleCurrentLineDefault(
	tiles: boolean[]
): Array<BubbleCurrentDirection> {
	return chunk(tiles, levelWidth).map((row) =>
		bitsToBubbleCurrentDirection(
			row.slice(levelWidth - 2) as [boolean, boolean]
		)
	);
}

function bitsToBubbleCurrentDirection(
	bits: [boolean, boolean]
): BubbleCurrentDirection {
	return ((bits[1] ? 1 : 0) + (bits[0] ? 1 : 0) * 2) as BubbleCurrentDirection;
}

function readMonster(
	address: number,
	getByte: (address: number) => number
): Monster {
	return {
		type: getByte(address) & 0b111,
		spawnPoint: {
			x: (getByte(address) & 0b11111000) + 20,
			y: (getByte(address + 1) & 0b11111110) + 21,
		},
		facingLeft: isBitSet(getByte(address + 2), 0),
	};
}

function readSprites(getByte: (address: number) => number): Sprites {
	const sprites: Sprites = {
		player: [],
		bubbleBuster: [],
		incendo: [],
		colley: [],
		hullaballoon: [],
		beluga: [],
		willyWhistle: [],
		stoner: [],
		superSocket: [],
	};
	let globalSpriteIndex = 0;
	for (const [characterName, characterSprites] of Object.entries(sprites) as [
		keyof Sprites,
		Sprite[]
	][]) {
		for (
			let spriteIndex = 0;
			spriteIndex < spriteCounts[characterName];
			++spriteIndex
		) {
			const sprite = readSprite(getByte, globalSpriteIndex);
			++globalSpriteIndex;
			characterSprites.push(sprite);
		}
	}
	return sprites;
}

function readSprite(
	getByte: (address: number) => number,
	spriteIndex: number
): Sprite {
	const bitmap: Sprite["bitmap"] = [];
	for (let byteIndex = 0; byteIndex < numSpriteBytes; ++byteIndex) {
		bitmap.push(
			getByte(spriteBitmapArrayAddress + spriteIndex * 64 + byteIndex)
		);
	}
	return {
		bitmap,
	};
}

export function patchPrg(prg: Uint8Array, levels: readonly Level[]) {
	if (levels.length !== 100) {
		throw new Error(`Wrong number of levels: ${levels.length}. Should be 100.`);
	}
	const asymmetricLevels = levels.filter(
		(level) => !levelIsSymmetric(level.tiles)
	);
	if (asymmetricLevels.length > maxAsymmetric) {
		throw new Error(
			`Too many asymmetric levels: ${asymmetricLevels.length}. Should be max ${maxAsymmetric}.`
		);
	}
	const sidebarLevels = levels.filter((level) => !!level.sidebarChars);
	if (sidebarLevels.length > maxSidebars) {
		throw new Error(
			`Too many levels with sidebar graphics: ${sidebarLevels.length}. Should be max ${maxSidebars}.`
		);
	}

	const startAddres = getPrgStartAddress(new DataView(prg.buffer));
	const setByte = (address: number, value: number) =>
		setPrgByteAtAddress(prg, startAddres, address, value);
	const setBytes = (address: number, bytes: number[]) => {
		let currentAddress = address;
		for (const byte of bytes) {
			setByte(currentAddress, byte);
			++currentAddress;
		}
	};

	// Write platform chars.
	setBytes(
		platformCharArrayAddress,
		levels.flatMap((level) =>
			level.platformChar.lines.map(
				(line) =>
					(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
			)
		)
	);

	// Write sidebar chars.
	setBytes(
		sidebarCharArrayAddress,
		levels.flatMap(
			(level) =>
				level.sidebarChars?.flatMap((char) =>
					char.lines.map(
						(line) =>
							(line[0] << 6) + (line[1] << 4) + (line[2] << 2) + (line[3] << 0)
					)
				) ?? []
		)
	);

	// Write level colors.
	setBytes(
		bgColorMetadataArrayAddress,
		levels.map((level) => level.bgColorLight + (level.bgColorDark << 4))
	);

	// // Buggy. Levels turn black.
	// // Write holes.
	// for (const [levelIndex, level] of levels.slice(1).entries()) {
	// 	const topLeft = !level.tiles[10];
	// 	const topRight = !level.tiles[20];
	// 	const bottomLeft = !level.tiles[10 + 32 * 24];
	// 	const bottomRight = !level.tiles[20 + 32 * 24];
	// 	setByte(
	// 		bgColorMetadataArrayAddress + levelIndex,
	// 		(topLeft ? 1 << 0 : 0) +
	// 			(topRight ? 1 << 1 : 0) +
	// 			(bottomLeft ? 1 << 2 : 0) +
	// 			(bottomRight ? 1 << 3 : 0)
	// 	);
	// }

	// // Write symmetry.
	// setBytes(
	// 	symmetryMetadataArrayAddress,
	// 	levels.map(
	// 		(level) =>
	// 			((levelIsSymmetric(level.tiles) ? 1 : 0) << 7) +
	// 			((!level.sidebarChars ? 1 : 0) << 6)
	// 	)
	// );

	// // Write platforms bitmap
	// const levelBitmapBytes = levels.flatMap((level) => {
	// 	const isSymmetric = levelIsSymmetric(level.tiles);

	// 	const rows = [];
	// 	for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
	// 		rows.push(
	// 			level.tiles.slice(
	// 				rowIndex * 32,
	// 				rowIndex * 32 + (isSymmetric ? 16 : 32)
	// 			)
	// 		);
	// 	}
	// 	const tiles = rows.flat();

	// 	const byteBits = [];
	// 	for (let tileIndex = 0; tileIndex < tiles.length; tileIndex += 8) {
	// 		byteBits.push(tiles.slice(tileIndex, tileIndex + 8));
	// 	}

	// 	const bytes = byteBits.map(
	// 		(bits) =>
	// 			((bits[0] ? 1 : 0) << 7) +
	// 			((bits[1] ? 1 : 0) << 6) +
	// 			((bits[2] ? 1 : 0) << 5) +
	// 			((bits[3] ? 1 : 0) << 4) +
	// 			((bits[4] ? 1 : 0) << 3) +
	// 			((bits[5] ? 1 : 0) << 2) +
	// 			((bits[6] ? 1 : 0) << 1) +
	// 			((bits[7] ? 1 : 0) << 0)
	// 	);

	// 	return bytes;
	// });
	// const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	// if (levelBitmapBytes.length > maxLevelBytes) {
	// 	throw new Error("Too many level bytes.");
	// }
	// setBytes(bitmapArrayAddress, levelBitmapBytes);

	// // Buggy. Only one monster.
	// // Write monsters.
	// const monsterBytes = levels
	// 	.flatMap((level) =>
	// 		level.monsters
	// 			.map((monster) => {
	// 				return [
	// 					((monster.spawnPoint.x - 20) & 0b11111000) + monster.type,
	// 					(monster.spawnPoint.y - 21) & 0b11111110,
	// 					(monster.facingLeft ? 1 : 0) << 7,
	// 				];
	// 			})
	// 			.map((monsterBytes) => [...monsterBytes, 0])
	// 	)
	// 	.flat();
	// setBytes(monsterArrayAddress, monsterBytes);
}
