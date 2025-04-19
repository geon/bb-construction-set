import { sum } from "./functions";
import { Tuple } from "./tuple";

export function isBitSet(byte: number, bitIndex: number): boolean {
	return !!(byte & (0b10000000 >> bitIndex));
}

export function byteToBits(byte: number): Tuple<boolean, 8> {
	const bits = [];
	for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
		bits[bitIndex] = isBitSet(byte, bitIndex);
	}
	return bits as Tuple<boolean, 8>;
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
