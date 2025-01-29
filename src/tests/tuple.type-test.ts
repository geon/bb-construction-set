import { ReadonlyTuple, Tuple } from "../tuple.ts";

{
	const tuple: Tuple<number, 2> = undefined!;

	// @ts-expect-error Negative index is not allowed on tuples.
	const num_1: number = tuple[-1];
	const num0: number = tuple[0];
	const num1: number = tuple[1];
	// @ts-expect-error Access after tuple is undefined
	const num2: number = tuple[2];

	num_1;
	num0;
	num1;
	num2;
}

{
	const tuple: Tuple<number, 2> = undefined!;

	// @ts-expect-error The length should be known.
	const num1: 1 = tuple.length;
	const num2: 2 = tuple.length;

	num1;
	num2;
}

{
	const readonlyTuple: ReadonlyTuple<number, 2> = undefined!;

	// @ts-expect-error Readonly should work.
	readonlyTuple[0] = 1;
	// @ts-expect-error Readonly should work.
	readonlyTuple.reverse();
	// @ts-expect-error Readonly should work.
	const tuple: Tuple<number, 2> = readonlyTuple;

	readonlyTuple;
	tuple;
}
