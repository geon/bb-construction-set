import { Monster } from "../level";
import { isBitSet } from "./bit-twiddling";

export function readMonsters(monsterBytes: DataView) {
	const monstersForAllLevels: Monster[][] = [];

	for (let levelIndex = 0; levelIndex < 100; ++levelIndex) {
		// Level 100 is the boss level. It has no monsters.
		if (levelIndex === 99) {
			monstersForAllLevels.push([]);
			continue;
		}

		// TODO: Remove.
		let currentMonsterByteIndex = 0;
		for (let index = 0; index < levelIndex; ++index) {
			do {
				currentMonsterByteIndex += 3;
			} while (monsterBytes.getUint8(currentMonsterByteIndex));
			currentMonsterByteIndex += 1; // The monsters of each level are separated with a zero byte.
		}

		const monsters: Monster[] = [];
		do {
			monsters.push(readMonster(currentMonsterByteIndex, monsterBytes));
			currentMonsterByteIndex += 3;
		} while (monsterBytes.getUint8(currentMonsterByteIndex));

		monstersForAllLevels.push(monsters);
	}

	return monstersForAllLevels;
}

// TODO: Restrict the DataView to a single monster.
function readMonster(address: number, monsterBytes: DataView): Monster {
	return {
		type: monsterBytes.getUint8(address) & 0b111,
		spawnPoint: {
			x: (monsterBytes.getUint8(address) & 0b11111000) + 20,
			y: (monsterBytes.getUint8(address + 1) & 0b11111110) + 21,
		},
		facingLeft: isBitSet(monsterBytes.getUint8(address + 2), 0),
	};
}
