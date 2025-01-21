import { GetByte } from "./types";

export function getPrgStartAddress(prg: DataView): number {
	// The prg contains a little endian 16 bit header with the start address. The rest is the raw data.
	return prg.getUint16(0, true);
}

export function getPrgByteAtAddress(
	prg: DataView,
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
): number {
	const offset = 2 - startAddres + address;
	if (offset >= prg.byteLength) {
		throw new Error("File is too short.");
	}
	return (prg[offset] = value);
}

export function getBytes(
	getByte: GetByte,
	address: number,
	length: number
): readonly number[] {
	const bytes = Array<number>(length);
	for (let index = 0; index < length; ++index) {
		bytes[index] = getByte(address + index);
	}
	return bytes;
}
