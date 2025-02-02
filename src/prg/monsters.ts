import { Monster } from "../level";
import { isBitSet } from "./bit-twiddling";
import { bytesPerMonster, maxMonsters } from "./data-locations";
import { dataViewSlice } from "./io";
import { ReadonlyUint8Array } from "./types";

export function readMonsters(monsterBytes: ReadonlyUint8Array) {
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
					dataViewSlice(monsterBytes, currentMonsterByteIndex, bytesPerMonster)
				)
			);
			currentMonsterByteIndex += bytesPerMonster;
		} while (monsterBytes[currentMonsterByteIndex]);
		currentMonsterByteIndex += 1; // The monsters of each level are separated with a zero byte.

		monstersForAllLevels.push(monsters);
	}

	return monstersForAllLevels;
}

function readMonster(monsterBytes: ReadonlyUint8Array): Monster {
	return {
		type: monsterBytes[0] & 0b111,
		spawnPoint: {
			x: (monsterBytes[0] & 0b11111000) + 20,
			y: (monsterBytes[1] & 0b11111110) + 21,
		},
		facingLeft: isBitSet(monsterBytes[2], 0),
	};
}

export function patchMonsters(
	dataView: Uint8Array,
	monsterses: readonly Monster[][]
) {
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
				((monster.spawnPoint.x - 20) & 0b11111000) + monster.type,
				((monster.spawnPoint.y - 21) & 0b11111110) +
					// TODO: No idea what the rest of the bits are.
					(dataView[currentMonsterStartByte + 1] & 0b00000001),
				((monster.facingLeft ? 1 : 0) << 7) +
					// TODO: No idea what the rest of the bits are.
					(dataView[currentMonsterStartByte + 2] & 0b01111111),
			];
			monsterStartByte += 3;
			return subSubBytes;
		});
		monsterStartByte += 1;
		// Terminate each level with a zero.
		return [...subBytes, 0];
	});

	dataView.set(bytes);
}
