export function isBitSet(byte: number, bitIndex: number): boolean {
	return !!(byte & (0b10000000 >> bitIndex));
}

export function byteToBits(
	byte: number
): readonly [
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean,
	boolean
] {
	const bits = [];
	for (let bitIndex = 0; bitIndex < 8; ++bitIndex) {
		bits[bitIndex] = isBitSet(byte, bitIndex);
	}
	return bits as [
		boolean,
		boolean,
		boolean,
		boolean,
		boolean,
		boolean,
		boolean,
		boolean
	];
}
