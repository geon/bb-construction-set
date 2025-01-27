import { Monster } from "../level";
import { isBitSet } from "./bit-twiddling";
import { GetBoundedByte } from "./io";
import { GetByte } from "./types";

export function readMonsters(getMonsterByte: GetBoundedByte) {
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
			} while (getMonsterByte(currentMonsterByteIndex));
			currentMonsterByteIndex += 1; // The monsters of each level are separated with a zero byte.
		}

		const monsters: Monster[] = [];
		do {
			monsters.push(readMonster(currentMonsterByteIndex, getMonsterByte));
			currentMonsterByteIndex += 3;
		} while (getMonsterByte(currentMonsterByteIndex));

		monstersForAllLevels.push(monsters);
	}

	return monstersForAllLevels;
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
