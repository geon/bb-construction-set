import { Char } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { mapRecord, objectEntries, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import {
	charGroupMeta,
	CharSegmentName,
} from "../game-definitions/char-segment-name";
import { DataSegment, Patch, patchFromSegment } from "./io";
import { mapTuple } from "../tuple";
import { CharGroups, CharGroup } from "../internal-data-formats/char-group";
import { charSegmentLocations } from "./data-locations";

export function parseCharGroups(
	dataSegments: Record<CharSegmentName, DataSegment>
): CharGroups {
	return mapRecord(
		dataSegments,
		(dataSegment, segmentName): CharGroup<number, number> => {
			const charBlocks = strictChunk(
				strictChunk(
					strictChunk([...dataSegment.buffer], linesPerChar).map(
						(char): Char => mapTuple(char, parseColorPixelByte)
					),
					charGroupMeta[segmentName].height
				),
				charGroupMeta[segmentName].width
			);

			return charBlocks;
		}
	);
}

export function serializeCharGroups(
	charGroups: CharGroups
): Record<CharSegmentName, DataSegment> {
	return mapRecord(
		charGroups,
		(charGroup): DataSegment => ({
			mask: 0xff,
			buffer: new Uint8Array(
				charGroup
					.flat()
					.flat()
					.flatMap((char) =>
						char.map(
							(line) =>
								(line[0] << 6) +
								(line[1] << 4) +
								(line[2] << 2) +
								(line[3] << 0)
						)
					)
			),
		})
	);
}

export function getCharGroupsPatch(charGroups: CharGroups): Patch {
	const newCharSegments = serializeCharGroups(charGroups);
	return objectEntries(newCharSegments).flatMap(
		([segmentName, newCharSegment]) =>
			patchFromSegment(charSegmentLocations[segmentName], newCharSegment.buffer)
	);
}
