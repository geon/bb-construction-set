import { Character } from "../internal-data-formats/level";
import { isBitSet } from "../bit-twiddling";
import {
	bytesPerMonster,
	levelSegmentLocations,
	maxMonsters,
} from "./data-locations";
import { ReadonlyUint8Array } from "../types";
import { characterNames } from "../game-definitions/character-name";
import { Patch, SingleBytePatch } from "./io";

export function readMonsters(monsterBytes: ReadonlyUint8Array) {
	const monstersForAllLevels: Character[][] = [];

	let currentMonsterByteIndex = 0;
	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		// Level 100 is the boss level. It has no monsters.
		if (levelIndex === 99) {
			monstersForAllLevels.push([]);
			continue;
		}

		const monsters: Character[] = [];
		do {
			monsters.push(
				readMonster(
					monsterBytes.subarray(
						currentMonsterByteIndex,
						currentMonsterByteIndex + bytesPerMonster
					)
				)
			);
			currentMonsterByteIndex += bytesPerMonster;
		} while (monsterBytes[currentMonsterByteIndex]);
		currentMonsterByteIndex += 1; // The monsters of each level are separated with a zero byte.

		monstersForAllLevels.push(monsters);
	}

	return monstersForAllLevels;
}

function readMonster(monsterBytes: ReadonlyUint8Array): Character {
	return {
		characterName: characterNames[(monsterBytes[0]! & 0b111) + 1]!,
		spawnPoint: {
			x: (monsterBytes[0]! & 0b11111000) + 20,
			y: (monsterBytes[1]! & 0b11111110) + 21,
		},
		facingLeft: isBitSet(monsterBytes[2]!, 0),
	};
}

export function writeMonsters(monsterses: readonly Character[][]): Patch {
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
					((monster.spawnPoint.x - 20) & 0b11111000) +
						(characterNames.indexOf(monster.characterName) - 1),
				],
				[monster.spawnPoint.y - 21, 0b11111110],
				[(monster.facingLeft ? 1 : 0) << 7, 0b10000000],
			]);
			// Terminate each level with a zero.
			return [...subBytes, [0] as const];
		})
		.map(
			([value, mask], index): SingleBytePatch => [
				levelSegmentLocations.monsters.startAddress + index,
				value,
				mask,
			]
		);
}
