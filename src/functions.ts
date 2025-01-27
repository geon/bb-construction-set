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

export function zipObject<TResult extends object>(arrays: {
	readonly [TKey in keyof TResult]: ReadonlyArray<TResult[TKey]>;
}): ReadonlyArray<TResult> {
	// TODO: Why the cast?
	const arraysEntries = Object.entries(arrays) as [
		string,
		ReadonlyArray<unknown>
	][];

	const lengths = new Set(arraysEntries.map(([, array]) => array.length));
	const [length] = lengths;
	if (length === undefined) {
		throw new Error("Must have arrays to zip.");
	}
	if (lengths.size !== 1) {
		throw new Error(
			"Can't zip different length arrays. " +
				arraysEntries
					.map(([name, array]) => `${name}: ${array.length}`)
					.join(", ")
		);
	}

	const results: Array<TResult> = [];
	for (let index = 0; index < length; ++index) {
		results.push(
			Object.fromEntries(
				arraysEntries.map(([name, array]) => [name, array[index]] as const)
			) as TResult
		);
	}
	return results;
}

export function mapRecord<TKey extends string, TIn, TOut>(
	record: Readonly<Record<TKey, TIn>>,
	transform: (value: TIn, key: TKey) => TOut
): Readonly<Record<TKey, TOut>> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [
			key,
			transform(value as TIn, key as TKey),
		])
	) as Readonly<Record<TKey, TOut>>;
}
