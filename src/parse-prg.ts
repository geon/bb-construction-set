import { readCharsetChar } from "./charset-char";
import { Level, Monster, createLevel, levelHeight, levelWidth } from "./level";
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

export function parsePrg(prg: DataView): {
	levels: Level[];
	sprites: Sprites;
} {
	const startAddres = getPrgStartAddress(prg);
	const getByte = (address: number) =>
		getPrgByteAtAddress(prg, startAddres, address);

	// TODO: Check the original data size, and verify.
	const levels: Array<Level> = [];
	let curentBitmapByteAddress = bitmapArrayAddress;
	let currentSidebarAddress = sidebarCharArrayAddress;
	let currentMonsterAddress = monsterArrayAddress;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		let level;
		({
			level,
			currentSidebarAddress,
			curentBitmapByteAddress,
			currentMonsterAddress,
		} = readLevel(
			getByte,
			levelIndex,
			currentSidebarAddress,
			curentBitmapByteAddress,
			currentMonsterAddress
		));

		levels.push(level);
	}

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

	return { levels, sprites };
}

function readLevel(
	getByte: (address: number) => number,
	levelIndex: number,
	currentSidebarAddress: number,
	curentBitmapByteAddress: number,
	currentMonsterAddress: number
) {
	const level = createLevel();

	level.platformChar = readCharsetChar(
		getByte,
		platformCharArrayAddress + levelIndex * 8
	);

	const bgColorMetadata = getByte(bgColorMetadataArrayAddress + levelIndex);
	level.bgColorLight = bgColorMetadata & 0b1111;
	level.bgColorDark = (bgColorMetadata & 0b11110000) >> 4;

	const holeMetadata = getByte(holeMetadataArrayAddress + levelIndex);

	// Top and bottom rows with holes.
	setTileBitmapTopAndBottom(level, {
		topLeft: isBitSet(holeMetadata, 7),
		topRight: isBitSet(holeMetadata, 6),
		bottomLeft: isBitSet(holeMetadata, 5),
		bottomRight: isBitSet(holeMetadata, 4),
	});

	const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);

	if (!isBitSet(symmetryMetadata, 1)) {
		level.sidebarChars = [
			readCharsetChar(getByte, currentSidebarAddress + 0 * 8),
			readCharsetChar(getByte, currentSidebarAddress + 1 * 8),
			readCharsetChar(getByte, currentSidebarAddress + 2 * 8),
			readCharsetChar(getByte, currentSidebarAddress + 3 * 8),
		];
		currentSidebarAddress += 4 * 8; // 4 chars of 8 bytes each.
	}

	level.isSymmetric = isBitSet(symmetryMetadata, 0);

	readTileBitmap(curentBitmapByteAddress, getByte, level, level.isSymmetric);
	curentBitmapByteAddress += (level.isSymmetric ? 2 : 4) * 23; // 23 lines of 2 or 4 bytes.

	// Fill in the sides.
	fillInTileBitmapSides(level);

	// Level 100 is the boss level. It has no monsters.
	if (levelIndex !== 99) {
		do {
			level.monsters.push(readMonster(currentMonsterAddress, getByte));
			currentMonsterAddress += 3;
		} while (getByte(currentMonsterAddress)); // The monsters of each level are separated with a zero byte.
		currentMonsterAddress += 1;
	}

	return {
		level,
		currentSidebarAddress,
		curentBitmapByteAddress,
		currentMonsterAddress,
	};
}

function setTileBitmapTopAndBottom(
	level: Level,
	{
		topLeft,
		topRight,
		bottomLeft,
		bottomRight,
	}: Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight", boolean>
) {
	for (let x = 0; x < levelWidth; ++x) {
		level.tiles[x] = true;
		level.tiles[(levelHeight - 1) * levelWidth + x] = true;
	}
	// Cut out the holes.
	for (let x = 0; x < 4; ++x) {
		if (topLeft) {
			level.tiles[9 + x] = false;
		}
		if (topRight) {
			level.tiles[19 + x] = false;
		}
		if (bottomLeft) {
			level.tiles[768 + 9 + x] = false;
		}
		if (bottomRight) {
			level.tiles[768 + 19 + x] = false;
		}
	}
}

function fillInTileBitmapSides(level: Level) {
	for (let rowIndex = 0; rowIndex < 23; ++rowIndex) {
		// Offset by 32 for the top line.
		level.tiles[32 + rowIndex * levelWidth] = true;
		level.tiles[32 + rowIndex * levelWidth + 1] = true;
		level.tiles[32 + (rowIndex + 1) * levelWidth - 2] = true;
		level.tiles[32 + (rowIndex + 1) * levelWidth - 1] = true;
	}
}

function readTileBitmap(
	curentBitmapByteAddress: number,
	getByte: (address: number) => number,
	level: Level,
	isSymmetric: boolean
) {
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
			const bitmapByte = getByte(curentBitmapByteAddress);
			curentBitmapByteAddress += 1;
			// Convert the bitmap to an array of bools.
			for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
				// Offset by 32 for the top line.
				level.tiles[32 + bitmapByteIndex * 8 + bitIndex] = isBitSet(
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
				level.tiles[tileRowStartIndex + tilesPerHalfRow + halfRowIndex] =
					level.tiles[tileRowStartIndex + tilesPerHalfRow - halfRowIndex - 1];
			}
		}
	}
}

function readMonster(
	address: number,
	getByte: (address: number) => number
): Monster {
	return {
		spawnPoint: {
			x: (getByte(address) & 0b11111000) + 0,
			y: getByte(address + 1) - 20,
		},
	};
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
