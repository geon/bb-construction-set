import { mapRecord } from "../functions";
import { segmentLocations } from "./data-locations";
import { GetByte, ReadonlyDataView } from "./types";

export function getPrgStartAddress(prg: ArrayBuffer): number {
	// The prg contains a little endian 16 bit header with the start address. The rest is the raw data.
	return new DataView(prg).getUint16(0, true);
}

export function getPrgByteAtAddress(
	prg: ReadonlyDataView,
	startAddres: number,
	address: number
): number {
	// Skip the header, then start counting at the startAddress.
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	return prg.getUint8(offset);
}

export function setPrgByteAtAddress(
	prg: Uint8Array,
	startAddres: number,
	address: number,
	value: number
): void {
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	prg[offset] = value;
}

export function getBytes(dataView: ReadonlyDataView): readonly number[] {
	const length = dataView.byteLength;
	const bytes = Array<number>(length);
	for (let index = 0; index < length; ++index) {
		bytes[index] = dataView.getUint8(index);
	}
	return bytes;
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

export function dataViewSlice(
	dataView: ReadonlyDataView,
	byteOffset: number,
	byteLength: number
): ReadonlyDataView {
	if (byteOffset < 0) {
		throw new Error("Negative offset.");
	}

	if (byteOffset > dataView.byteLength) {
		throw new Error("Too large offset.");
	}

	if (byteLength + byteOffset > dataView.byteLength) {
		throw new Error("Too large length.");
	}

	return new DataView(
		(dataView as DataView).buffer,
		(dataView as DataView).byteOffset + byteOffset,
		byteLength
	);
}

type DataSegmentName = keyof typeof segmentLocations;

export type ReadonlyDataSegments = Record<DataSegmentName, ReadonlyDataView>;

export function getDataSegments(prg: ArrayBuffer): ReadonlyDataSegments {
	const prgStartAddress = getPrgStartAddress(prg);
	return mapRecord(
		segmentLocations,
		(segmentLocation) =>
			new DataView(
				prg,
				segmentLocation.startAddress - prgStartAddress + 2, // 2 bytes extra for the prg header.
				segmentLocation.length
			)
	);
}
