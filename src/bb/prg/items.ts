import { Char } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { mapRecord, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import { CharSegmentName } from "../game-definitions/char-segment-name";
import { DataSegment } from "./io";
import { mapTuple } from "../tuple";
import { CharGroups, CharGroup } from "../internal-data-formats/item";

export const charGroupMeta = {
	bubbleBlow: {
		width: 3,
		height: 2,
		count: 12 * 2,
		hasMask: true,
		transposed: false,
	},
	bubblePop: {
		width: 3,
		height: 2,
		count: 8,
		hasMask: false,
		transposed: false,
	},
	baronVonBlubba: {
		width: 3,
		height: 2,
		count: 4 * 2,
		hasMask: true,
		transposed: false,
	},
	specialBubbles: {
		width: 3,
		height: 2,
		count: 12,
		hasMask: false,
		transposed: false,
	},
	lightning: {
		width: 2,
		height: 2,
		count: 1 * 2,
		hasMask: true,
		transposed: false,
	},
	fire: {
		width: 3,
		height: 2,
		count: 4 * 2,
		hasMask: true,
		transposed: false,
	},
	extendBubbles: {
		width: 3,
		height: 2,
		count: 20,
		hasMask: false,
		transposed: false,
	},
	stonerWeapon: {
		width: 3,
		height: 2,
		count: 2,
		hasMask: false,
		transposed: false,
	},
	drunkAndInvaderWeapon: {
		width: 2,
		height: 2,
		count: 5 * 2,
		hasMask: true,
		transposed: false,
	},
	incendoWeapon: {
		width: 2,
		height: 2,
		count: 4 * 2,
		hasMask: true,
		transposed: false,
	},
	items: {
		width: 2,
		height: 2,
		count: 58,
		hasMask: false,
		transposed: false,
	},
	largeLightning: {
		width: 5,
		height: 2,
		count: 1 * 2,
		hasMask: true,
		transposed: false,
	},
	bonusRoundCircles: {
		width: 2,
		height: 2,
		count: 3,
		hasMask: false,
		transposed: false,
	},
	flowingWater: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
	},
	fireOnGround: {
		width: 1,
		height: 1,
		count: 2,
		hasMask: false,
		transposed: false,
	},
	secretLevelPlatform: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
	},
	secretLevelSideDecor: {
		width: 2,
		height: 2,
		count: 1,
		hasMask: false,
		transposed: true,
	},
	secretLevelPedestal: {
		width: 7,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
	},
	secretLevelPedestalRightEdge: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
	},
	secretLevelPedestalDoor: {
		width: 2,
		height: 2,
		count: 1,
		hasMask: false,
		transposed: false,
	},
	secretLevelBasementDoor: {
		width: 3,
		height: 2,
		count: 1,
		hasMask: false,
		transposed: false,
	},
} as const satisfies Record<
	CharSegmentName,
	{
		readonly width: number;
		readonly height: number;
		readonly count: number;
		readonly hasMask: boolean;
		readonly transposed: boolean;
	}
>;

export function readItems(
	dataSegments: Record<CharSegmentName, DataSegment>
): CharGroups {
	return mapRecord(
		dataSegments,
		(dataSegment, segmentName): CharGroup<number, number> => {
			const items = strictChunk(
				strictChunk(
					strictChunk([...dataSegment.buffer], linesPerChar).map(
						(char): Char => mapTuple(char, parseColorPixelByte)
					),
					charGroupMeta[segmentName].height
				),
				charGroupMeta[segmentName].width
			);

			return items;
		}
	);
}

export function serializeItems(
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
