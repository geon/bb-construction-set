import { Monster } from "../level";
import { isBitSet } from "./bit-twiddling";
import { monsterArrayAddress } from "./data-locations";
import { GetByte } from "./types";

export function readMonstersForLevel(levelIndex: number, getByte: GetByte) {
	// Level 100 is the boss level. It has no monsters.
	if (levelIndex === 99) {
		return [];
	}

	let currentMonsterAddress = monsterArrayAddress;
	for (let index = 0; index < levelIndex; ++index) {
		do {
			currentMonsterAddress += 3;
		} while (getByte(currentMonsterAddress));
		currentMonsterAddress += 1; // The monsters of each level are separated with a zero byte.
	}

	const monsters: Monster[] = [];
	do {
		monsters.push(readMonster(currentMonsterAddress, getByte));
		currentMonsterAddress += 3;
	} while (getByte(currentMonsterAddress));

	return monsters;
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
