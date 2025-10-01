import { bitsToByte, byteToBits } from "../bit-twiddling";
import {
	mapRecord,
	objectEntries,
	strictChunk,
	unzipObject,
	zipObject,
} from "../functions";
import {
	ItemSpawnPositions,
	PerLevelItemSpawnPositions,
} from "../internal-data-formats/item-spawn-positions";
import { assertTuple } from "../tuple";
import {
	ItemSpawnPositionArrayName,
	itemSpawnPositionsSegmentLocations,
} from "./data-locations";
import { DataSegment, Patch, patchFromSegment } from "./io";

export function parseItemSpawnPositions(
	dataSegment: Record<ItemSpawnPositionArrayName, DataSegment>
): ItemSpawnPositions {
	return zipObject({
		aByte: [...dataSegment.a.buffer],
		bByte: [...dataSegment.b.buffer],
		cByte: [...dataSegment.c.buffer],
	}).map(({ aByte, bByte, cByte }): PerLevelItemSpawnPositions => {
		const aBits = byteToBits(aByte);
		const bBits = byteToBits(bByte);
		const cBits = byteToBits(cByte);

		return {
			points: {
				x: bitsToByte([
					//
					aBits[0],
					aBits[1],
					aBits[2],
					aBits[3],
					aBits[4],
				]),
				y: bitsToByte([
					//
					aBits[5],
					aBits[6],
					aBits[7],
					bBits[0],
					bBits[1],
				]),
			},
			powerups: {
				x: bitsToByte([
					//
					bBits[2],
					bBits[3],
					bBits[4],
					bBits[5],
					bBits[6],
				]),
				y: bitsToByte([
					//
					bBits[7],
					cBits[0],
					cBits[1],
					cBits[2],
					cBits[3],
				]),
			},
		};
	});
}

export function serializeItemSpawnPositions(
	itemSpawnPositions: ItemSpawnPositions
): Record<ItemSpawnPositionArrayName, DataSegment> {
	const arrays = unzipObject(
		itemSpawnPositions.map((spawn) => {
			const [a, b, c] = assertTuple(
				strictChunk(
					[
						spawn.points.x,
						spawn.points.y,
						spawn.powerups.x,
						spawn.powerups.y,
						// Zero for padding.
						0,
					]
						.map((byte) => byteToBits(byte).slice(3))
						.flat()
						// (4+1) bytes x 5 bits = 25 bits. Slice off the excess bit.
						.slice(0, -1),
					8
				).map(bitsToByte),
				3
			);

			return { a, b, c };
		})
	);

	return mapRecord(
		arrays,
		(array, segmentName): DataSegment => ({
			buffer: new Uint8Array(array),
			mask: itemSpawnPositionsSegmentLocations[segmentName].mask,
		})
	);
}

export function getItemSpawnPositionsPatch(
	itemSpawnPositions: ItemSpawnPositions
): Patch {
	const newSegments = serializeItemSpawnPositions(itemSpawnPositions);

	return objectEntries(newSegments).flatMap(([segmentName, newSegment]) =>
		patchFromSegment(
			itemSpawnPositionsSegmentLocations[segmentName],
			newSegment.buffer
		)
	);
}
