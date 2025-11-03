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
				readMonster(
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

const positionMask = 0b11111000;
const nameMask = 0b00000111;
const delayMask = 0b00111111;
const facingLeftBit = 0b10000000;

function readMonster(
	monsterBytes: Tuple<number, typeof bytesPerMonster>
): Monster {
	return {
		characterName: monsterNames[monsterBytes[0] & nameMask]!,
		spawnPoint: {
			x: (monsterBytes[0] & positionMask) + 20,
			y: (monsterBytes[1] & positionMask) + 21,
		},
		facingLeft: !!(monsterBytes[2] & facingLeftBit),
		// The game also shifts left when reading the delay.
		delay: monsterBytes[2] & 0b00111111,
	};
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
			const subBytes = monsters.flatMap((monster) => [
				[
					((monster.spawnPoint.x - 20) & positionMask) |
						(monsterNames.indexOf(monster.characterName) & nameMask),
				],
				[monster.spawnPoint.y - 21, positionMask],
				[
					(monster.facingLeft ? facingLeftBit : 0) | monster.delay,
					facingLeftBit | delayMask,
				],
			]);
			// Terminate each level with a zero.
			return [...subBytes, [0] as const];
		})
		.map(
			([value, mask], index): SingleBytePatchEntry => [
				levelSegmentLocations.monsters.startAddress + index,
				[value, mask],
			]
		);
}
