type CharsetCharColor = 0 | 1 | 2 | 3;

type CharsetCharLine = [
	CharsetCharColor,
	CharsetCharColor,
	CharsetCharColor,
	CharsetCharColor
];

export interface CharsetChar {
	lines: [
		CharsetCharLine,
		CharsetCharLine,
		CharsetCharLine,
		CharsetCharLine,
		CharsetCharLine,
		CharsetCharLine,
		CharsetCharLine,
		CharsetCharLine
	];
}

export function readCharsetChar(
	getByte: (address: number) => number,
	address: number
): CharsetChar {
	const lines: CharsetCharLine[] = [];
	for (let i = 0; i < 8; ++i) {
		const line = parseCharsetCharLine(getByte(address + i));
		lines.push(line);
	}
	return { lines: lines as CharsetChar["lines"] };
}

export function parseCharsetCharLine(byte: number): CharsetCharLine {
	return [
		(byte >> 6) & 0b11,
		(byte >> 4) & 0b11,
		(byte >> 2) & 0b11,
		(byte >> 0) & 0b11,
	] as CharsetCharLine;
}
