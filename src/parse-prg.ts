import { readCharsetChar } from "./charset-char";
import {
	Level,
	Monster,
	createLevel,
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

	const isSymmetric = isBitSet(symmetryMetadata, 0);

	readTileBitmap(curentBitmapByteAddress, getByte, level, isSymmetric);
	curentBitmapByteAddress += (isSymmetric ? 2 : 4) * 23; // 23 lines of 2 or 4 bytes.

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
		type: getByte(address) & 0b111,
		spawnPoint: {
			x: (getByte(address) & 0b11111000) + 20,
			y: (getByte(address + 1) & 0b11111110) + 21,
		},
		facingLeft: isBitSet(getByte(address + 2), 0),
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

	// Buggy. Levels turn black.
	// // Write holes.
	// for (const [levelIndex, level] of levels.entries()) {
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

	// Write symmetry.
	setBytes(
		symmetryMetadataArrayAddress,
		levels.map(
			(level) =>
				((levelIsSymmetric(level.tiles) ? 1 : 0) << 7) +
				((level.sidebarChars ? 1 : 0) << 6)
		)
	);

	// Write platforms bitmap
	const levelBitmapBytes = levels.flatMap((level) => {
		const isSymmetric = levelIsSymmetric(level.tiles);

		const rows = [];
		for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
			rows.push(
				level.tiles.slice(
					rowIndex * 32,
					rowIndex * 32 + (isSymmetric ? 16 : 32)
				)
			);
		}
		const tiles = rows.flat();

		const byteBits = [];
		for (let tileIndex = 0; tileIndex < tiles.length; tileIndex += 8) {
			byteBits.push(tiles.slice(tileIndex, tileIndex + 8));
		}

		const bytes = byteBits.map(
			(bits) =>
				((bits[0] ? 1 : 0) << 7) +
				((bits[1] ? 1 : 0) << 6) +
				((bits[2] ? 1 : 0) << 5) +
				((bits[3] ? 1 : 0) << 4) +
				((bits[4] ? 1 : 0) << 3) +
				((bits[5] ? 1 : 0) << 2) +
				((bits[6] ? 1 : 0) << 1) +
				((bits[7] ? 1 : 0) << 0)
		);

		return bytes;
	});
	const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	if (levelBitmapBytes.length > maxLevelBytes) {
		throw new Error("Too many level bytes.");
	}
	setBytes(bitmapArrayAddress, levelBitmapBytes);

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
