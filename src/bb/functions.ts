import { NOfTuple, Tuple, MutableTuple } from "./tuple";

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

export function strictChunk<T, TChunkLength extends number>(
	array: readonly T[],
	chunkLength: TChunkLength
): MutableTuple<T, TChunkLength>[] {
	if (array.length % chunkLength !== 0) {
		throw new Error(
			"Strict chunked array.length must be a multiple of chunkLength." +
				" " +
				`array.length: ${array.length}, chunkLength: ${chunkLength}`
		);
	}
	return chunk(array, chunkLength) as MutableTuple<T, TChunkLength>[];
}

export function sum(array: readonly number[]): number {
	return array.reduce((a, b) => a + b, 0);
}

type ZipObjectReturnElement<
	TInput extends Record<string, ReadonlyArray<unknown> | undefined>
> = {
	[Key in keyof TInput]:
		| Exclude<TInput[Key], undefined>[number]
		| (TInput[Key] extends ReadonlyArray<unknown> ? never : undefined);
};

export function zipObject<
	TInput extends Record<string, Tuple<unknown, number> | undefined>
>(
	arrays: TInput
): Tuple<
	ZipObjectReturnElement<TInput>,
	NOfTuple<Exclude<TInput[keyof TInput], undefined>>
> {
	const arraysEntries = Object.entries(arrays)
		.map(([key, value]) => value && ([key, value] as const))
		.filter(isDefined);

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

	const results: Array<ZipObjectReturnElement<TInput>> = [];
	for (let index = 0; index < length; ++index) {
		results.push(
			Object.fromEntries(
				arraysEntries.map(([name, array]) => [name, array[index]] as const)
			) as ZipObjectReturnElement<TInput>
		);
	}
	return results as Tuple<
		ZipObjectReturnElement<TInput>,
		NOfTuple<Exclude<TInput[keyof TInput], undefined>>
	>;
}

export function unzipObject<TInput extends object>(
	array: ReadonlyArray<TInput>
): { readonly [TKey in keyof TInput]: ReadonlyArray<TInput[TKey]> } {
	const result = {} as any;

	for (const [index, element] of array.entries()) {
		for (const [name, value] of Object.entries(element)) {
			if (!result[name]) {
				result[name] = Array(array.length).fill(undefined);
			}
			result[name][index] = value;
		}
	}

	return result;
}

export function mapRecord<TKey extends string, TIn, TOut>(
	record: Readonly<Record<TKey, TIn>>,
	transform: (value: TIn, key: TKey) => TOut
): Record<TKey, TOut> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [
			key,
			transform(value as TIn, key as TKey),
		])
	) as Readonly<Record<TKey, TOut>>;
}

export function mapPartialRecord<TKey extends string, TIn, TOut>(
	record: Partial<Readonly<Record<TKey, TIn>>>,
	transform: (value: TIn, key: TKey) => TOut
): Readonly<Partial<Record<TKey, TOut>>> {
	return mapRecord(record as Record<TKey, TIn>, transform);
}

export function isDefined<T>(x: T | undefined): x is T {
	return x !== undefined;
}

export function range<N extends number>(
	length: N,
	from: number = 0
): Tuple<number, N> {
	return Array(length)
		.fill(undefined)
		.map((_, index) => index + from) as Tuple<number, N>;
}

// https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
export function objectFromEntries<
	const T extends ReadonlyArray<readonly [PropertyKey, unknown]>
>(entries: T): { [K in T[number] as K[0]]: K[1] } {
	return Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] };
}

export function objectEntries<T extends Record<PropertyKey, unknown>>(
	obj: T
): { [K in keyof T]: [K, T[K]] }[keyof T][] {
	return Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][];
}

export type Attempt<T> =
	| {
			readonly type: "ok";
			readonly result: T;
	  }
	| {
			readonly type: "error";
			readonly error: string;
	  };
export function attempt<T>(fn: () => T): Attempt<T> {
	try {
		return {
			type: "ok",
			result: fn(),
		};
	} catch (e) {
		return {
			type: "error",
			error: e instanceof Error ? e.message : "Error",
		};
	}
}

type Curried<TFn extends (...args: readonly unknown[]) => unknown> =
	TFn extends (
		firstArg: infer FirstArg,
		...restArgs: infer RestArgs
	) => infer Return
		? (firstArg: FirstArg) => (...restArgs: RestArgs) => Return
		: never;

// `args` must be `any` to allow the function to be used.
export function curry<TFn extends (...args: readonly any[]) => unknown>(
	fn: TFn
): Curried<TFn> {
	return ((firstArg) =>
		(...restArgs) =>
			fn(firstArg, ...restArgs)) as Curried<TFn>;
}

type OneOrMore<T> = readonly [T, ...ReadonlyArray<T>];
type MutableOneOrMore<T> = [T, ...Array<T>];
export type Grouped<Key extends string | number | symbol, Value> = Partial<
	Record<Key, OneOrMore<Value>>
>;
export function groupBy<Key extends string | number, Item, Value>(
	items: ReadonlyArray<Item>,
	keySelector: (item: Item) => Key,
	valueSelector: (item: Item) => Value = (x) => x as unknown as Value
): Grouped<Key, Value> {
	const grouped: Partial<Record<Key, MutableOneOrMore<Value>>> = {};
	for (const item of items) {
		const key = keySelector(item);
		const value = valueSelector(item);
		const keyItems = grouped[key];
		if (!keyItems) {
			grouped[key] = [value];
		} else {
			keyItems.push(value);
		}
	}
	return grouped;
}

export async function mapAsync<TIn, TOut>(
	array: ReadonlyArray<TIn>,
	transform: (value: TIn, index: number) => Promise<TOut>
): Promise<ReadonlyArray<TOut>> {
	const result: Array<TOut> = [];
	for (const [index, element] of array.entries()) {
		result.push(await transform(element, index));
	}
	return result;
}

export function indexOfMinBy<T>(
	array: OneOrMore<T>,
	accessor: (value: T) => number
): number {
	let min = Number.POSITIVE_INFINITY;
	let minIndex = 0;

	for (const [index, value] of array.map(accessor).entries()) {
		if (value < min) {
			min = value;
			minIndex = index;
		}
	}

	return minIndex;
}

export function minBy<T>(
	array: OneOrMore<T>,
	accessor: (value: T) => number
): T {
	return array[indexOfMinBy(array, accessor) ?? 0]!;
}

export function checkedAccess<Indexable, Key extends keyof Indexable>(
	record: Indexable,
	key: Key
	// https://www.reddit.com/r/typescript/comments/18ya5sv/type_narrowing_and_t_null/
): Exclude<Indexable[Key], undefined> {
	const value = record[key];
	if (value === undefined) {
		throw new Error("Missing value.");
	}

	// Casting because the actual type `Indexable[Key] & ({} | null)` is confusing.
	return value as Exclude<Indexable[Key], undefined>;
}

export function updateArrayAtIndex<T>(
	array: ReadonlyArray<T>,
	index: number,
	updater: (oldElement: T) => T
): ReadonlyArray<T> {
	if (index >= array.length) {
		throw new Error(
			`Index out of bounds. index: ${index}, array.length: ${array.length}`
		);
	}

	const newArray = array.slice();
	newArray.splice(index, 1, updater(array[index]!));
	return newArray;
}
