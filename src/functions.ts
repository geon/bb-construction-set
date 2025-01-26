export function padRight<T>(
	array: readonly T[],
	length: number,
	padding: T
): T[] {
	const result = array.slice();
	while (result.length < length) {
		result.push(padding);
	}
	return result;
}

export function chunk<T>(array: readonly T[], chunkLength: number): T[][] {
	const chunks: T[][] = [];
	let start = 0;
	do {
		chunks.push(array.slice(start, start + chunkLength));
		start += chunkLength;
	} while (start < array.length);
	return chunks;
}

export function sum(array: readonly number[]): number {
	return array.reduce((a, b) => a + b, 0);
}
