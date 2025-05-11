export interface ReadonlyUint8Array
	extends Omit<
		Uint8Array,
		"copyWithin" | "fill" | "reverse" | "set" | "sort" | "subarray"
	> {
	readonly [n: number]: number;
	readonly subarray: (
		...args: Parameters<Uint8Array["subarray"]>
	) => ReadonlyUint8Array;
}

export type OneOrMore<T> = readonly [T, ...ReadonlyArray<T>];
