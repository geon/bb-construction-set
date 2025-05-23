import { curry, mapRecord } from "../functions";
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
export type MutableDataSegment = _DataSegment<Uint8Array>;

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

function _getDataSegments<
	TReadonlyOrMutable extends "readonly" | "mutable",
	TDataSegmentName extends string
>(
	prg: ArrayBuffer,
	levelSegmentLocations: Readonly<Record<TDataSegmentName, SegmentLocation>>
): TReadonlyOrMutable extends "readonly"
	? Record<TDataSegmentName, DataSegment>
	: Record<TDataSegmentName, MutableDataSegment> {
	return mapRecord(levelSegmentLocations, curry(getDataSegment)(prg));
}

export function getDataSegments<TDataSegmentName extends string>(
	prg: ArrayBuffer,
	levelSegmentLocations: Readonly<Record<TDataSegmentName, SegmentLocation>>
): Record<TDataSegmentName, DataSegment> {
	return _getDataSegments<"readonly", TDataSegmentName>(
		prg,
		levelSegmentLocations
	);
}
export function getMutableDataSegments<TDataSegmentName extends string>(
	prg: ArrayBuffer,
	levelSegmentLocations: Readonly<Record<TDataSegmentName, SegmentLocation>>
): Record<TDataSegmentName, MutableDataSegment> {
	return _getDataSegments<"mutable", TDataSegmentName>(
		prg,
		levelSegmentLocations
	);
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
