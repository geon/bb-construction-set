export type GetByte = (address: number) => number;
export type SetByte = (address: number, value: number) => void;

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
