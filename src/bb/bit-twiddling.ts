import { range, sum } from "./functions";
import { mapTuple, ReadonlyTuple } from "./tuple";

export function isBitSet(byte: number, bitIndex: number): boolean {
	return !!(byte & (0b10000000 >> bitIndex));
}

export function byteToBits(byte: number): ReadonlyTuple<boolean, 8> {
	return mapTuple(range(8), (bitIndex) => isBitSet(byte, bitIndex));
}

export function bitsToByte(bits: ReadonlyArray<boolean>): number {
	return sum(
		bits
			.slice()
			.reverse()
			.map((set, index) => (set ? 2 ** index : 0))
	);
}

export function mirrorBits(byte: number): number {
	return sum(
		byteToBits(byte)
			.slice()
			.reverse()
			.map((bit, index) => (bit ? 1 : 0) << (7 - index))
	);
}
