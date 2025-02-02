import { mapRecord } from "../functions";
import { segmentLocations } from "./data-locations";
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

type DataSegmentName = keyof typeof segmentLocations;

export type ReadonlyDataSegments = Record<DataSegmentName, ReadonlyUint8Array>;
export type MutableDataSegments = Record<DataSegmentName, Uint8Array>;

export function getDataSegments<
	TReadonlyOrMutable extends "readonly" | "mutable" = "readonly"
>(
	prg: ArrayBuffer
): TReadonlyOrMutable extends "readonly"
	? ReadonlyDataSegments
	: MutableDataSegments {
	const prgStartAddress = getPrgStartAddress(prg);
	return mapRecord(
		segmentLocations,
		(segmentLocation) =>
			new Uint8Array(
				prg,
				segmentLocation.startAddress - prgStartAddress + 2, // 2 bytes extra for the prg header.
				segmentLocation.length
			)
	);
}
