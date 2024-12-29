export type CharsetCharColor = 0 | 1 | 2 | 3;

export type CharsetCharLine = [
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

export type CharBlock = [CharsetChar, CharsetChar, CharsetChar, CharsetChar];

export function parseCharsetCharLine(byte: number): CharsetCharLine {
	return [
		(byte >> 6) & 0b11,
		(byte >> 4) & 0b11,
		(byte >> 2) & 0b11,
		(byte >> 0) & 0b11,
	] as CharsetCharLine;
}
