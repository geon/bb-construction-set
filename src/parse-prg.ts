import { CharBlock } from "./charset-char";
import { chunk } from "./functions";
import {
	bitmapArrayAddress,
	sidebarCharArrayAddress,
	monsterArrayAddress,
	windCurrentsArrayAddress,
	bgColorMetadataArrayAddress,
	holeMetadataArrayAddress,
	symmetryMetadataArrayAddress,
	platformCharArrayAddress,
	spriteBitmapArrayAddress,
} from "./prg/data-locations";
import {
	BubbleCurrentDirection,
	BubbleCurrentRectangle,
	BubbleCurrentRectangleOrSymmetry,
	BubbleCurrents,
	Level,
	Monster,
	PerLineBubbleCurrentDefaults,
	Tiles,
	createTiles,
	levelHeight,
	levelIsSymmetric,
	levelWidth,
	maxAsymmetric,
	maxMonsters,
	maxSidebars,
} from "./level";
import { GetByte } from "./prg/types";
import { readBgColorsForLevel } from "./prg/bg-colors";
import {
	CharacterName,
	Sprite,
	Sprites,
	characterNames,
	numSpriteBytes,
	spriteCounts,
} from "./sprite";
import { readCharBlock, readCharsetChar } from "./prg/charset-char";
import { isBitSet } from "./prg/bit-twiddling";
import {
	getPrgStartAddress,
	getPrgByteAtAddress,
	setPrgByteAtAddress,
} from "./prg/io";
import { readItems } from "./prg/items";

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

function readLevels(getByte: GetByte): Array<Level> {
	// TODO: Check the original data size, and verify.

	const levels: Array<Level> = [];
	let addresses = {
		currentBitmapByteAddress: bitmapArrayAddress,
		currentSidebarAddress: sidebarCharArrayAddress,
		currentMonsterAddress: monsterArrayAddress,
		currentWindCurrentsAddress: windCurrentsArrayAddress,
	};
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		let level;
		({ level, addresses } = readLevel(getByte, levelIndex, addresses));

		levels.push(level);
	}
	return levels;
}

function readLevel(
	getByte: GetByte,
	levelIndex: number,
	addresses: {
		currentSidebarAddress: number;
		currentBitmapByteAddress: number;
		currentMonsterAddress: number;
		currentWindCurrentsAddress: number;
	}
) {
	const { bgColorLight, bgColorDark } = readBgColorsForLevel(
		getByte,
		levelIndex
	);

	const platformChar = readCharsetChar(
		getByte,
		platformCharArrayAddress + levelIndex * 8
	);

	const { sidebarChars, currentSidebarAddress } = readSidebarChars(
		levelIndex,
		addresses.currentSidebarAddress,
		getByte
	);

	const { tiles, bubbleCurrentLineDefault, currentBitmapByteAddress } =
		readTilesAndBubbleCurrentLineDefault(
			levelIndex,
			addresses.currentBitmapByteAddress,
			getByte
		);

	const { monsters, currentMonsterAddress } = readMonstersForLevel(
		addresses.currentMonsterAddress,
		levelIndex,
		getByte
	);

	const { bubbleCurrents, currentWindCurrentsAddress } =
		readBubbleCurrentRectangles(
			addresses.currentWindCurrentsAddress,
			getByte,
			bubbleCurrentLineDefault
		);

	const level: Level = {
		platformChar,
		bgColorLight,
		bgColorDark,
		sidebarChars,
		tiles,
		monsters,
		bubbleCurrents,
	};

	return {
		level,
		addresses: {
			currentSidebarAddress,
			currentBitmapByteAddress,
			currentMonsterAddress,
			currentWindCurrentsAddress,
		},
	};
}

// Bytes are within [square brackets].
// Values are separated | with | pipes.
//
// For each rectangle:
//
// [NotSure | Count]
// [a bbbbbbb]
export function readBubbleCurrentRectangles(
	startingWindCurrentsAddress: number,
	getByte: GetByte,
	perLineDefaults: PerLineBubbleCurrentDefaults
): {
	readonly bubbleCurrents: BubbleCurrents;
	readonly currentWindCurrentsAddress: number;
} {
	let currentWindCurrentsAddress = startingWindCurrentsAddress;

	const firstByte = getByte(currentWindCurrentsAddress++);
	const copy = isBitSet(firstByte, 0);
	const firstByteWithoutCopyFlag = firstByte & 0b01111111;

	if (copy) {
		return {
			bubbleCurrents: {
				type: "copy",
				levelIndex: firstByteWithoutCopyFlag,
				perLineDefaults,
			},
			currentWindCurrentsAddress,
		};
	}

	const byteCount = Math.max(1, firstByteWithoutCopyFlag);

	if (!byteCount) {
		return {
			bubbleCurrents: {
				type: "rectangles",
				rectangles: [],
				perLineDefaults,
			},
			currentWindCurrentsAddress,
		};
	}

	const rectangles: BubbleCurrentRectangleOrSymmetry[] = [];
	while (currentWindCurrentsAddress - startingWindCurrentsAddress < byteCount) {
		const firstByte = getByte(currentWindCurrentsAddress++);
		const symmetry = !isBitSet(firstByte, 0);
		if (symmetry) {
			rectangles.push({
				type: "symmetry",
			});

			continue;
		}

		rectangles.push({
			type: "rectangle",
			...bytesToBubbleCurrentRectangle([
				firstByte,
				getByte(currentWindCurrentsAddress++),
				getByte(currentWindCurrentsAddress++),
			]),
		});
	}

	return {
		bubbleCurrents: {
			type: "rectangles",
			rectangles,
			perLineDefaults,
		},
		currentWindCurrentsAddress,
	};
}

export function bytesToBubbleCurrentRectangle(
	bytes: [number, number, number]
): BubbleCurrentRectangle {
	// Bytes are within [square brackets].
	// Values are separated | with | pipes.
	// [Skip | Direction | Left] | [Top | Wid][th | Unused | Height]
	// [a  bb ccccc] [ddddd eee][ee f ggggg]

	const direction = ((bytes[0] & 0b01100000) >> 5) as BubbleCurrentDirection;
	const left = bytes[0] & 0b00011111;
	const top = (bytes[1] & 0b11111000) >> 3;
	const width =
		(((bytes[1] & 0b00000111) << 2) | ((bytes[2] & 0b11000000) >> 6)) + 1;
	const height = (bytes[2] & 0b00011111) + 1;

	return {
		left,
		top,
		width,
		height,
		direction,
	};
}

export function bubbleCurrentRectangleToBytes(
	rectangle: BubbleCurrentRectangle
): [number, number, number] {
	const bytes: [number, number, number] = [0, 0, 0];

	// const direction = ((bytes[0] & 0b01100000) >> 5) as BubbleCurrentDirection;
	// const left = bytes[0] & 0b00011111;
	// const top = (bytes[1] & 0b11111000) >> 3;
	// const width = ((bytes[1] & 0b00000111) << 2) | ((bytes[2] & 0b11000000) >> 6);
	// const height = bytes[2] & 0b00011111;

	bytes[0] = (rectangle.direction << 5) | rectangle.left;
	bytes[1] = (rectangle.top << 3) | ((rectangle.width - 1) >> 2);
	bytes[2] =
		(((rectangle.width - 1) << 6) & 0b11000000) | (rectangle.height - 1);
	return bytes;
}

function readSidebarChars(
	levelIndex: number,
	currentSidebarAddress: number,
	getByte: GetByte
) {
	const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);

	let sidebarChars: Level["sidebarChars"] = undefined;
	if (!isBitSet(symmetryMetadata, 1)) {
		sidebarChars = readCharBlock(getByte, currentSidebarAddress);
		currentSidebarAddress += 4 * 8; // 4 chars of 8 bytes each.
	}
	return { sidebarChars, currentSidebarAddress };
}

function readTilesAndBubbleCurrentLineDefault(
	levelIndex: number,
	currentBitmapByteAddress: number,
	getByte: GetByte
) {
	const tiles = createTiles();

	// Fill in top and bottom row.
	for (let x = 0; x < levelWidth; ++x) {
		tiles[0][x] = true;
		tiles[levelHeight - 1][x] = true;
	}
	// Cut out the holes.
	const holeMetadata = getByte(holeMetadataArrayAddress + levelIndex);
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

	const symmetryMetadata = getByte(symmetryMetadataArrayAddress + levelIndex);
	const isSymmetric = isBitSet(symmetryMetadata, 0);

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
	getByte: GetByte
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

function readMonster(address: number, getByte: GetByte): Monster {
	return {
		type: getByte(address) & 0b111,
		spawnPoint: {
			x: (getByte(address) & 0b11111000) + 20,
			y: (getByte(address + 1) & 0b11111110) + 21,
		},
		facingLeft: isBitSet(getByte(address + 2), 0),
	};
}

function readSprites(getByte: GetByte): Sprites {
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

function readSprite(getByte: GetByte, spriteIndex: number): Sprite {
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
				((level.bubbleCurrents.perLineDefaults[0] & 0b01 ? 1 : 0) << 4) +
				((level.bubbleCurrents.perLineDefaults[0] & 0b10 ? 1 : 0) << 5) +
				((level.bubbleCurrents.perLineDefaults[24] & 0b01 ? 1 : 0) << 6) +
				((level.bubbleCurrents.perLineDefaults[24] & 0b10 ? 1 : 0) << 7)
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
				level.bubbleCurrents.perLineDefaults[rowIndex] & 0b01
			);
			row[bitPositions[1]] = !!(
				level.bubbleCurrents.perLineDefaults[rowIndex] & 0b10
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
