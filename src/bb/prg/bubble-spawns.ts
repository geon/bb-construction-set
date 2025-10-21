import { bitsToByte, byteToBits } from "../bit-twiddling";
import {
	BubbleSpawns,
	PerLevelBubbleSpawns,
} from "../internal-data-formats/bubble-spawns.ts";
import { assertTuple } from "../tuple.ts";
import { ReadonlyUint8Array } from "../types.ts";
import { levelSegmentLocations } from "./data-locations.ts";
import { DataSegment, Patch, patchFromSegment } from "./io";

export function readBubbleSpawns(buffer: ReadonlyUint8Array): BubbleSpawns {
	return assertTuple(
		[...buffer].map((byte): PerLevelBubbleSpawns => {
			const [, , , , lightning, fire, water, extend] = byteToBits(byte);
			return {
				lightning,
				fire,
				water,
				extend,
			};
		}),
		100
	);
}

export function serializeBubbleSpawns(bubbleSpawns: BubbleSpawns): DataSegment {
	return {
		buffer: new Uint8Array(
			bubbleSpawns.map((spawn) => {
				return bitsToByte([
					spawn.lightning,
					spawn.fire,
					spawn.water,
					spawn.extend,
				]);
			})
		),
		mask: levelSegmentLocations.bubbleSpawns.mask,
	};
}

export function getBubbleSpawnsPatch(bubbleSpawns: BubbleSpawns): Patch {
	return patchFromSegment(
		levelSegmentLocations.bubbleSpawns,
		serializeBubbleSpawns(bubbleSpawns).buffer
	);
}
