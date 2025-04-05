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
