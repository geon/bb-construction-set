import { isBitSet } from "../bit-twiddling";

type Holes = Record<"top" | "bottom", Record<"left" | "right", boolean>>;
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
