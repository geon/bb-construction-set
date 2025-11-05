import { Monster } from "../internal-data-formats/level";
import {
	bytesPerMonster,
	levelSegmentLocations,
	maxMonsters,
} from "./data-locations";
import { ReadonlyUint8Array } from "../types";
import { monsterNames } from "../game-definitions/character-name";
import { Patch, SingleBytePatchEntry } from "./io";
import { assertTuple, Tuple } from "../tuple";
import { add, Coord2, subtract } from "../../math/coord2";
import { mapRecord } from "../functions";

const prgMonsterPositionOffset: Coord2 = {
	x: 20,
	y: 21,
};

const positionMask = 0b11111000;
const nameMask = 0b00000111;
const delayMask = 0b00111111;
const facingLeftBit = 0b01000000;
const a_3A1C_top_3_mask = 0b00000111;
const a_3A1C_last_mask = 0b10000000;

type SingleMonsterBytes = Tuple<number, typeof bytesPerMonster>;

function parseMonster(monsterBytes: SingleMonsterBytes): Monster {
	const rawPrgPosition: Coord2 = {
		x: monsterBytes[0],
		y: monsterBytes[1],
	};
	const prgPosition = mapRecord(rawPrgPosition, (x) => x & positionMask);
	const spawnPoint = add(prgPosition, prgMonsterPositionOffset);

	return {
		characterName: monsterNames[monsterBytes[0] & nameMask]!,
		spawnPoint,
		facingLeft: !!(monsterBytes[2] & facingLeftBit),
		// The game also shifts left when reading the delay.
		delay: monsterBytes[2] & delayMask,
		confirmed_mystery_bits_A_3A1C:
			((monsterBytes[1] & a_3A1C_top_3_mask) << 1) |
			((monsterBytes[2] & a_3A1C_last_mask) >> 7),
	};
}

function serializeMonster(monster: Monster): SingleMonsterBytes {
	const confirmed_mystery_bits_A_3A1C =
		monster.confirmed_mystery_bits_A_3A1C ?? createMysteryBits(monster);

	const rawPrgPosition = subtract(monster.spawnPoint, prgMonsterPositionOffset);
	const prgPosition = mapRecord(rawPrgPosition, (x) => x & positionMask);

	return [
		prgPosition.x | (monsterNames.indexOf(monster.characterName) & nameMask),
		prgPosition.y | (confirmed_mystery_bits_A_3A1C >> 1),
		(monster.facingLeft ? facingLeftBit : 0) |
			monster.delay |
			((confirmed_mystery_bits_A_3A1C & 1) << 7),
	];
}

export function readMonsters(
	monsterBytes: ReadonlyUint8Array
): Tuple<readonly Monster[], 100> {
	const monstersForAllLevels: Monster[][] = [];

	let currentMonsterByteIndex = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		// Level 100 is the boss level. It has no monsters.
		if (levelIndex === 99) {
			monstersForAllLevels.push([]);
			continue;
		}

		const monsters: Monster[] = [];
		do {
			monsters.push(
				parseMonster(
					assertTuple(
						[
							...monsterBytes.subarray(
								currentMonsterByteIndex,
								currentMonsterByteIndex + bytesPerMonster
							),
						],
						bytesPerMonster
					)
				)
			);
			currentMonsterByteIndex += bytesPerMonster;
		} while (monsterBytes[currentMonsterByteIndex]);
		currentMonsterByteIndex += 1; // The monsters of each level are separated with a zero byte.

		monstersForAllLevels.push(monsters);
	}

	return assertTuple(monstersForAllLevels, 100);
}

export function getMonstersPatch(
	monsterses: Tuple<readonly Monster[], 100>
): Patch {
	const numMonsters = monsterses.flatMap((monsters) => monsters).length;
	if (numMonsters > maxMonsters) {
		throw new Error(
			`Too many monsters: ${numMonsters}. Should be max ${maxMonsters}.`
		);
	}

	// Write monsters.
	return monsterses
		.flatMap((monsters) => {
			const subBytes = monsters.flatMap(serializeMonster);
			// Terminate each level with a zero.
			return [...subBytes, 0];
		})
		.map(
			(value, index): SingleBytePatchEntry => [
				levelSegmentLocations.monsters.startAddress + index,
				[value],
			]
		);
}

function createMysteryBits(monster: Monster): number {
	const movingLeft = monster.facingLeft ? 0b0001 : 0;
	const movingRight = !monster.facingLeft ? 0b0010 : 0;
	const leftRight = movingLeft | movingRight;

	const startingUp = true;
	const movingUp = startingUp ? 0b0001 : 0;
	const movingDown = !startingUp ? 0b0010 : 0;
	const upDown = movingUp | movingDown;

	switch (monster.characterName) {
		// Walkers
		case "bubbleBuster":
		case "stoner":
		case "incendo":
		case "willyWhistle": {
			return leftRight;
		}

		// Flyers
		case "beluga":
		case "hullaballoon": {
			return leftRight | upDown;
		}

		case "colley":
		case "superSocket": {
			return leftRight;
		}

		default: {
			return monster.characterName satisfies never;
		}
	}
}
