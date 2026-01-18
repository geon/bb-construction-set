import { isBitSet } from "../bit-twiddling";
import { Holes } from "../internal-data-formats/level";
import { Tuple, assertTuple, mapTuple } from "../tuple";
import { ReadonlyUint8Array } from "../types";

export function parseHoles(holeMetadata: number): Holes {
	return {
		top: {
			left: isBitSet(holeMetadata, 7),
			right: isBitSet(holeMetadata, 6),
		},
		bottom: {
			left: isBitSet(holeMetadata, 5),
			right: isBitSet(holeMetadata, 4),
		},
	};
}

export function readHoles(
	holeMetadataBytes: ReadonlyUint8Array,
): Tuple<Holes, 100> {
	return mapTuple(assertTuple([...holeMetadataBytes], 100), parseHoles);
}
