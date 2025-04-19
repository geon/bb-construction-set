import { Tuple } from "./tuple";

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
): Tuple<T, TChunkLength>[] {
	if (array.length % chunkLength !== 0) {
		throw new Error(
			"Strict chunked array.length must be a multiple of chunkLength." +
				" " +
				`array.length: ${array.length}, chunkLength: ${chunkLength}`
		);
	}
	return chunk(array, chunkLength) as Tuple<T, TChunkLength>[];
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
): Readonly<Record<TKey, TOut>> {
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

export function range(from: number, length: number): readonly number[] {
	return Array(length)
		.fill(undefined)
		.map((_, index) => index + from);
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
	return grouped as Grouped<Key, Value>;
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
