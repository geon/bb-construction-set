import { mapRecord } from "../functions";
import { LevelDataSegmentName, levelSegmentLocations } from "./data-locations";
import { GetByte, ReadonlyUint8Array } from "./types";

export function getPrgStartAddress(prg: ArrayBuffer): number {
	// The prg contains a little endian 16 bit header with the start address. The rest is the raw data.
	return new DataView(prg).getUint16(0, true);
}

export function getPrgByteAtAddress(
	prg: ReadonlyUint8Array,
	startAddres: number,
	address: number
): number {
	// Skip the header, then start counting at the startAddress.
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	return prg[offset];
}

export type GetBoundedByte = (index: number) => number;
export function makeGetBoundedByte({
	getByte,
	startAddress,
	length,
	segmentName,
}: {
	readonly getByte: GetByte;
	readonly startAddress: number;
	readonly length: number;
	readonly segmentName: string;
}): GetBoundedByte {
	return (index: number) => {
		if (index >= length) {
			throw new Error(
				`Reading out of bounds on segment "${segmentName}". Lenght: ${length}, Index: ${index}`
			);
		}
		return getByte(startAddress + index);
	};
}

type _DataSegment<BufferType extends ReadonlyUint8Array> = {
	readonly mask: number | undefined;
	readonly buffer: BufferType;
};

export type DataSegment = _DataSegment<ReadonlyUint8Array>;
export type MutableDataSegment = _DataSegment<Uint8Array>;

function _getDataSegments<TReadonlyOrMutable extends "readonly" | "mutable">(
	prg: ArrayBuffer
): TReadonlyOrMutable extends "readonly"
	? Record<LevelDataSegmentName, DataSegment>
	: Record<LevelDataSegmentName, MutableDataSegment> {
	const prgStartAddress = getPrgStartAddress(prg);
	return mapRecord(levelSegmentLocations, (segmentLocation) => {
		// 2 bytes extra for the prg header.
		const begin = segmentLocation.startAddress - prgStartAddress + 2;
		const length = segmentLocation.length;
		return {
			buffer: new Uint8Array(prg, begin, length),
			mask: segmentLocation.mask,
		};
	});
}

export function getDataSegments(
	prg: ArrayBuffer
): Record<LevelDataSegmentName, DataSegment> {
	return _getDataSegments<"readonly">(prg);
}
export function getMutableDataSegments(
	prg: ArrayBuffer
): Record<LevelDataSegmentName, MutableDataSegment> {
	return _getDataSegments<"mutable">(prg);
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
