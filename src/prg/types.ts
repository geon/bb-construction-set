export type GetByte = (address: number) => number;
export type SetByte = (address: number, value: number) => void;
export type SetBytes = (address: number, bytes: number[]) => void;
export type ReadonlyDataView = Pick<DataView, "getUint8" | "byteLength">;
