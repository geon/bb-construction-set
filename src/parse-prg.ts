import { CharBlock } from "./charset-char";
import { chunk } from "./functions";
import {
	bitmapArrayAddress,
	sidebarCharArrayAddress,
	monsterArrayAddress,
	bgColorMetadataArrayAddress,
	holeMetadataArrayAddress,
	symmetryMetadataArrayAddress,
	platformCharArrayAddress,
} from "./prg/data-locations";
import { Level, levelIsSymmetric } from "./level";
import { maxAsymmetric, maxMonsters, maxSidebars } from "./prg/data-locations";
import { GetByte } from "./prg/types";
import { readBgColorsForLevel } from "./prg/bg-colors";
import { Sprites } from "./sprite";
import { readCharsetChar } from "./prg/charset-char";
import {
	getPrgStartAddress,
	getPrgByteAtAddress,
	setPrgByteAtAddress,
} from "./prg/io";
import { readItems } from "./prg/items";
import { readBubbleCurrentRectangles } from "./prg/bubble-current-rectangles";
import { readSidebarChars } from "./prg/sidebar-chars";
import { readTilesAndBubbleCurrentLineDefault } from "./prg/tiles";
import { readMonsters } from "./prg/monsters";
import { readSprites } from "./prg/sprites";

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

	const allLevels_platformChar: Level["platformChar"][] = [];
	const allLevels_bgColorLight: Level["bgColorLight"][] = [];
	const allLevels_bgColorDark: Level["bgColorDark"][] = [];
	const allLevels_sidebarChars: Level["sidebarChars"][] = [];
	const allLevels_tiles: Level["tiles"][] = [];
	const allLevels_bubbleCurrents: Level["bubbleCurrents"][] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const { bgColorLight, bgColorDark } = readBgColorsForLevel(
			getByte,
			levelIndex
		);
		allLevels_bgColorLight.push(bgColorLight);
		allLevels_bgColorDark.push(bgColorDark);

		allLevels_platformChar.push(
			readCharsetChar(getByte, platformCharArrayAddress + levelIndex * 8)
		);

		const sidebarChars = readSidebarChars(levelIndex, getByte);
		allLevels_sidebarChars.push(sidebarChars);

		const { tiles, bubbleCurrentLineDefault } =
			readTilesAndBubbleCurrentLineDefault(levelIndex, getByte);
		allLevels_tiles.push(tiles);

		const bubbleCurrents = readBubbleCurrentRectangles(
			levelIndex,
			getByte,
			bubbleCurrentLineDefault
		);
		allLevels_bubbleCurrents.push(bubbleCurrents);
	}

	const allLevels_monsters = readMonsters(getByte);

	const levels: Array<Level> = [];
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		const level: Level = {
			platformChar: allLevels_platformChar[levelIndex],
			bgColorLight: allLevels_bgColorLight[levelIndex],
			bgColorDark: allLevels_bgColorDark[levelIndex],
			sidebarChars: allLevels_sidebarChars[levelIndex],
			tiles: allLevels_tiles[levelIndex],
			monsters: allLevels_monsters[levelIndex],
			bubbleCurrents: allLevels_bubbleCurrents[levelIndex],
		};
		levels.push(level);
	}
	return levels;
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
