import { checkedAccess, curry, mapRecord } from "../functions";
import { SegmentLocation } from "./data-locations";
import { ReadonlyUint8Array } from "../types";

function getPrgStartAddress(prg: ArrayBuffer): number {
	// The prg contains a little endian 16 bit header with the start address. The rest is the raw data.
	return new DataView(prg).getUint16(0, true);
}

type _DataSegment<BufferType extends ReadonlyUint8Array> = {
	readonly mask: number | undefined;
	readonly buffer: BufferType;
};

export type DataSegment = _DataSegment<ReadonlyUint8Array>;

export function getDataSegment(
	prg: ArrayBuffer,
	segmentLocation: SegmentLocation
): {
	readonly buffer: Uint8Array<ArrayBuffer>;
	readonly mask: number | undefined;
} {
	const prgStartAddress = getPrgStartAddress(prg);
	// 2 bytes extra for the prg header.
	const begin = segmentLocation.startAddress - prgStartAddress + 2;
	const length = segmentLocation.length;
	return {
		buffer: new Uint8Array(prg, begin, length),
		mask: segmentLocation.mask,
	};
}

export function getDataSegments<TDataSegmentName extends string>(
	prg: ArrayBuffer,
	levelSegmentLocations: Readonly<Record<TDataSegmentName, SegmentLocation>>
): Record<TDataSegmentName, DataSegment> {
	return mapRecord(levelSegmentLocations, curry(getDataSegment)(prg));
}

// https://stackoverflow.com/a/43933693/446536
export function uint8ArrayConcatenate(
	arrays: readonly Uint8Array[]
): Uint8Array {
	let totalLength = 0;
	for (const arr of arrays) {
		totalLength += arr.length;
	}
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

export function mixByte(
	newByte: number,
	originalByte: number,
	mask: number
): number {
	return (newByte & mask) | (originalByte & ~mask);
}

export type SingleBytePatch = readonly [value: number, mask?: number];
export type SingleBytePatchEntry = readonly [address: number, SingleBytePatch];
export type Patch = ReadonlyArray<SingleBytePatchEntry>;

export function applyPatch(prg: ArrayBuffer, patch: Patch): ArrayBuffer {
	const prgStartAddress = getPrgStartAddress(prg);

	const patchedPrg = new Uint8Array(prg.slice());
	for (const [address, [value, mask]] of patch) {
		const index = address - prgStartAddress + 2;
		patchedPrg[index] = mixByte(
			value,
			checkedAccess(patchedPrg, index),
			mask ?? 0xff
		);
	}
	return patchedPrg;
}

export function patchFromSegment(
	segmentLocation: SegmentLocation,
	buffer: ReadonlyUint8Array,
	mask?: readonly boolean[]
): Patch {
	return [...buffer].map(
		(value, index): SingleBytePatchEntry => [
			segmentLocation.startAddress + index,
			[value, mask?.[index] !== false ? segmentLocation.mask : 0x00],
		]
	);
}
