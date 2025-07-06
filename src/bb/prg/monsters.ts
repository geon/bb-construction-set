import { Character } from "../internal-data-formats/level";
import { isBitSet } from "../bit-twiddling";
import { bytesPerMonster, maxMonsters } from "./data-locations";
import { ReadonlyUint8Array } from "../types";
import { characterNames } from "../game-definitions/character-name";

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

export function writeMonsters(
	TODO_REMOVE_THIS_oldByteArray: ReadonlyUint8Array,
	monsterses: readonly Character[][]
): Uint8Array {
	const numMonsters = monsterses.flatMap((monsters) => monsters).length;
	if (numMonsters > maxMonsters) {
		throw new Error(
			`Too many monsters: ${numMonsters}. Should be max ${maxMonsters}.`
		);
	}

	// Write monsters.
	let monsterStartByte = 0;
	const bytes = monsterses.flatMap((monsters) => {
		const subBytes = monsters.flatMap((monster) => {
			const currentMonsterStartByte = monsterStartByte;
			const subSubBytes = [
				((monster.spawnPoint.x - 20) & 0b11111000) +
					(characterNames.indexOf(monster.characterName) - 1),
				((monster.spawnPoint.y - 21) & 0b11111110) +
					// TODO: No idea what the rest of the bits are.
					(TODO_REMOVE_THIS_oldByteArray[currentMonsterStartByte + 1]! &
						0b00000001),
				((monster.facingLeft ? 1 : 0) << 7) +
					// TODO: No idea what the rest of the bits are.
					(TODO_REMOVE_THIS_oldByteArray[currentMonsterStartByte + 2]! &
						0b01111111),
			];
			monsterStartByte += 3;
			return subSubBytes;
		});
		monsterStartByte += 1;
		// Terminate each level with a zero.
		return [...subBytes, 0];
	});

	return new Uint8Array(bytes);
}
