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
	Tiles,
	createTiles,
	levelHeight,
	levelIsSymmetric,
	levelWidth,
	maxAsymmetric,
	maxMonsters,
	maxSidebars,
} from "./level";
import { PaletteIndex } from "./palette";
import {
	CharacterName,
	Sprite,
	Sprites,
	characterNames,
	numSpriteBytes,
	spriteCounts,
} from "./sprite";

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

	const bgColorLight = (bgColorMetadata & 0b1111) as PaletteIndex;
	const bgColorDark = ((bgColorMetadata & 0b11110000) >> 4) as PaletteIndex;

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
	const tiles = createTiles();

	// Fill in top and bottom row.
	for (let x = 0; x < levelWidth; ++x) {
		tiles[0][x] = true;
		tiles[levelHeight - 1][x] = true;
	}
	// Cut out the holes.
	const topLeft = isBitSet(holeMetadata, 7);
	const topRight = isBitSet(holeMetadata, 6);
	const bottomLeft = isBitSet(holeMetadata, 5);
	const bottomRight = isBitSet(holeMetadata, 4);
	for (let x = 0; x < 4; ++x) {
		if (topLeft) {
			tiles[0][9 + x] = false;
		}
		if (topRight) {
			tiles[0][19 + x] = false;
		}
		if (bottomLeft) {
			tiles[24][9 + x] = false;
		}
		if (bottomRight) {
			tiles[24][19 + x] = false;
		}
	}

	// Read tile bitmap.
	const bytesPerRow = 4;
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Read half or full lines from the level data.
		const bytesToRead = isSymmetric ? bytesPerRow / 2 : bytesPerRow;
		for (
			let bitmapByteOfRowIndex = 0;
			bitmapByteOfRowIndex < bytesToRead;
			++bitmapByteOfRowIndex
		) {
			const bitmapByte = getByte(currentBitmapByteAddress);
			currentBitmapByteAddress += 1;
			// Convert the bitmap to an array of bools.
			for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
				// Offset by 32 for the top line.
				tiles[rowIndex + 1][bitmapByteOfRowIndex * 8 + bitIndex] = isBitSet(
					bitmapByte,
					bitIndex
				);
			}
		}
		if (isSymmetric) {
			// Mirror the left half to the right half.
			const tilesPerHalfRow = (bytesPerRow / 2) * 8;
			for (
				let halfRowIndex = 0;
				halfRowIndex < tilesPerHalfRow;
				++halfRowIndex
			) {
				tiles[rowIndex + 1][tilesPerHalfRow + halfRowIndex] =
					tiles[rowIndex + 1][tilesPerHalfRow - halfRowIndex - 1];
			}
		}
	}

	const bubbleCurrentLineDefault = extractbubbleCurrentLineDefault(
		tiles,
		holeMetadata
	);

	// Fill in the sides.
	// The 2 tile wide left and right borders are used to store part of the bubbleCurrent.
	// It needs to be set to true to be solid.
	for (let rowIndex = 0; rowIndex < 25; ++rowIndex) {
		tiles[rowIndex][0] = true;
		tiles[rowIndex][1] = true;
		tiles[rowIndex][levelWidth - 2] = true;
		tiles[rowIndex][levelWidth - 1] = true;
	}

	return { tiles, bubbleCurrentLineDefault, currentBitmapByteAddress };
}

function readMonstersForLevel(
	currentMonsterAddress: number,
	levelIndex: number,
	getByte: (address: number) => number
) {
	// Level 100 is the boss level. It has no monsters.
	if (levelIndex === 99) {
		return { monsters: [], currentMonsterAddress };
	}

	const monsters: Monster[] = [];
	do {
		monsters.push(readMonster(currentMonsterAddress, getByte));
		currentMonsterAddress += 3;
	} while (getByte(currentMonsterAddress)); // The monsters of each level are separated with a zero byte.
	currentMonsterAddress += 1;

	return { monsters, currentMonsterAddress };
}

function extractbubbleCurrentLineDefault(
	tiles: Tiles,
	holeMetadata: number
): Array<BubbleCurrentDirection> {
	return [
		((holeMetadata & 0b00110000) >> 4) as BubbleCurrentDirection,
		...tiles
			.slice(1, 24)
			.map((row) =>
				bitsToBubbleCurrentDirection(
					row.slice(levelWidth - 2) as [boolean, boolean]
				)
			),
		((holeMetadata & 0b11000000) >> 6) as BubbleCurrentDirection,
	];
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

	const nameByIndex = characterNames.flatMap((name) =>
		Array<CharacterName>(spriteCounts[name]).fill(name as CharacterName)
	);

	for (const [globalSpriteIndex, characterName] of nameByIndex.entries()) {
		const sprite = readSprite(getByte, globalSpriteIndex);
		sprites[characterName].push(sprite);
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
	const getByte = (address: number) =>
		getPrgByteAtAddress(new DataView(prg.buffer), startAddres, address);

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

	// Write holes.
	for (const [levelIndex, level] of levels.entries()) {
		const topLeft = !level.tiles[0][10];
		const topRight = !level.tiles[0][20];
		const bottomLeft = !level.tiles[24][10];
		const bottomRight = !level.tiles[24][20];

		setByte(
			holeMetadataArrayAddress + levelIndex,
			((topLeft ? 1 : 0) << 0) +
				((topRight ? 1 : 0) << 1) +
				((bottomLeft ? 1 : 0) << 2) +
				((bottomRight ? 1 : 0) << 3) +
				// The most significant bits are the bubble current of the top and bottom rows.
				((level.bubbleCurrentLineDefault[0] & 0b01 ? 1 : 0) << 4) +
				((level.bubbleCurrentLineDefault[0] & 0b10 ? 1 : 0) << 5) +
				((level.bubbleCurrentLineDefault[24] & 0b01 ? 1 : 0) << 6) +
				((level.bubbleCurrentLineDefault[24] & 0b10 ? 1 : 0) << 7)
		);
	}

	// Write symmetry.
	setBytes(
		symmetryMetadataArrayAddress,
		levels.map(
			(level, index) =>
				((levelIsSymmetric(level.tiles) ? 1 : 0) << 7) +
				((!level.sidebarChars ? 1 : 0) << 6) +
				// TODO: No idea what the rest of the bits are.
				(getByte(symmetryMetadataArrayAddress + index) & 0b00111111)
		)
	);

	// Write platforms bitmap
	let foo = bitmapArrayAddress;
	const levelBitmapBytes = levels.flatMap((level) => {
		const isSymmetric = levelIsSymmetric(level.tiles);

		const bitRows = [];
		for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
			const row = level.tiles[rowIndex].slice(0, isSymmetric ? 16 : 32);

			// So stupid.
			const bitPositions = (
				{
					symmetric: [0, 1],
					notSymmetric: [31, 30],
				} as const
			)[isSymmetric ? "symmetric" : "notSymmetric"];

			// Encode the per-line bubble current into the edge of the platforms bitmap.
			row[bitPositions[0]] = !!(
				level.bubbleCurrentLineDefault[rowIndex] & 0b01
			);
			row[bitPositions[1]] = !!(
				level.bubbleCurrentLineDefault[rowIndex] & 0b10
			);

			bitRows.push(row);
		}

		const byteRows = bitRows
			.map((row) => chunk(row, 8))
			.map((row) =>
				row.map(
					(bits) =>
						((bits[0] ? 1 : 0) << 7) +
						((bits[1] ? 1 : 0) << 6) +
						((bits[2] ? 1 : 0) << 5) +
						((bits[3] ? 1 : 0) << 4) +
						((bits[4] ? 1 : 0) << 3) +
						((bits[5] ? 1 : 0) << 2) +
						((bits[6] ? 1 : 0) << 1) +
						((bits[7] ? 1 : 0) << 0)
				)
			);

		foo += isSymmetric ? 46 : 2 * 46;

		return byteRows.flat();
	});
	const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	if (levelBitmapBytes.length > maxLevelBytes) {
		throw new Error("Too many level bytes.");
	}
	setBytes(bitmapArrayAddress, levelBitmapBytes);

	// Write monsters.
	const numMonsters = levels.flatMap((level) => level.monsters).length;
	if (numMonsters > maxMonsters) {
		throw new Error(
			`Too many monsters: ${numMonsters}. Should be max ${maxMonsters}.`
		);
	}
	let monsterStartByte = monsterArrayAddress;
	for (const level of levels) {
		for (const monster of level.monsters) {
			const currentMonsterStartByte = monsterStartByte;
			setBytes(currentMonsterStartByte, [
				((monster.spawnPoint.x - 20) & 0b11111000) + monster.type,
				((monster.spawnPoint.y - 21) & 0b11111110) +
					// TODO: No idea what the rest of the bits are.
					(getByte(currentMonsterStartByte + 1) & 0b00000001),
				((monster.facingLeft ? 1 : 0) << 7) +
					// TODO: No idea what the rest of the bits are.
					(getByte(currentMonsterStartByte + 2) & 0b01111111),
			]);
			monsterStartByte += 3;
		}
		// Terminate each level with a zero.
		setByte(monsterStartByte, 0);
		monsterStartByte += 1;
	}
}
