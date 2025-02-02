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

export function getBytes(dataView: ReadonlyUint8Array): readonly number[] {
	const length = dataView.byteLength;
	const bytes = Array<number>(length);
	for (let index = 0; index < length; ++index) {
		bytes[index] = dataView[index];
	}
	return bytes;
}

export function dataViewSetBytes(
	dataView: Uint8Array,
	bytes: readonly number[]
): void {
	for (const [index, byte] of bytes.entries()) {
		dataView[index] = byte;
	}
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

export function dataViewSlice<
	TDataView extends ReadonlyUint8Array | Uint8Array
>(
	dataView: TDataView,
	byteOffset: number,
	byteLength: number
): TDataView extends Uint8Array ? Uint8Array : ReadonlyUint8Array {
	if (byteOffset < 0) {
		throw new Error("Negative offset.");
	}

	if (byteOffset > dataView.byteLength) {
		throw new Error("Too large offset.");
	}

	if (byteLength + byteOffset > dataView.byteLength) {
		throw new Error(
			`Too large length: ${byteLength}, Max: ${
				dataView.byteLength - byteOffset
			}`
		);
	}

	return new Uint8Array(
		(dataView as Uint8Array).buffer,
		(dataView as Uint8Array).byteOffset + byteOffset,
		byteLength
	);
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
