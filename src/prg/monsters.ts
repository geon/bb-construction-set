import { Monster } from "../level";
import { isBitSet } from "./bit-twiddling";
import { dataViewSlice } from "./io";

export function readMonsters(monsterBytes: DataView) {
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
				readMonster(dataViewSlice(monsterBytes, currentMonsterByteIndex, 3))
			);
			currentMonsterByteIndex += 3;
		} while (monsterBytes.getUint8(currentMonsterByteIndex));
		currentMonsterByteIndex += 1; // The monsters of each level are separated with a zero byte.

		monstersForAllLevels.push(monsters);
	}

	return monstersForAllLevels;
}

function readMonster(monsterBytes: DataView): Monster {
	return {
		type: monsterBytes.getUint8(0) & 0b111,
		spawnPoint: {
			x: (monsterBytes.getUint8(0) & 0b11111000) + 20,
			y: (monsterBytes.getUint8(1) & 0b11111110) + 21,
		},
		facingLeft: isBitSet(monsterBytes.getUint8(2), 0),
	};
}
