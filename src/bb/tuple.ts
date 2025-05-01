// // https://stackoverflow.com/a/52490977/446536
export type Tuple<T, N extends number> = N extends N
	? number extends N
		? T[]
		: _TupleOf<T, N, []>
	: never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
	? R
	: _TupleOf<T, N, [T, ...R]>;

export type ReadonlyTuple<T, N extends number> = N extends N
	? number extends N
		? readonly T[]
		: _ReadonlyTupleOf<T, N, []>
	: never;
type _ReadonlyTupleOf<
	T,
	N extends number,
	R extends readonly unknown[]
> = R["length"] extends N ? R : _ReadonlyTupleOf<T, N, readonly [T, ...R]>;

export function assertTuple<T, N extends number>(
	array: T[],
	n: N
): ReadonlyTuple<T, N> {
	if (array.length !== n) {
		throw new Error(`Bad length. Wanted: ${n} Actual: ${array.length}`);
	}
	return array as ReadonlyTuple<T, N>;
}

type TOfTuple<TTuple> = TTuple extends ReadonlyTuple<infer T, number>
	? T
	: never;
type NOfTuple<TTuple extends ReadonlyArray<unknown>> = TTuple["length"];

// Just a typed wrapper.
export function mapTuple<
	const TTuple extends ReadonlyTuple<unknown, number>,
	TOut
>(
	tuple: TTuple,
	fn: (value: TOfTuple<TTuple>) => TOut
): ReadonlyTuple<TOut, NOfTuple<typeof tuple>> {
	return assertTuple(
		(tuple as ReadonlyArray<TOfTuple<TTuple>>).map(fn),
		tuple.length as NOfTuple<typeof tuple>
	);
}
