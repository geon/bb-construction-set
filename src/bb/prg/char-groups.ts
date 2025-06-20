import { Char } from "../internal-data-formats/char";
import { parseColorPixelByte } from "../internal-data-formats/color-pixel-byte";
import { mapRecord, strictChunk } from "../functions";
import { linesPerChar } from "./charset-char";
import { CharSegmentName } from "../game-definitions/char-segment-name";
import { DataSegment } from "./io";
import { mapTuple } from "../tuple";
import { CharGroups, CharGroup } from "../internal-data-formats/char-group";

export const charGroupMeta = {
	bubbleBlow: {
		width: 3,
		height: 2,
		count: 12 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	bubblePop: {
		width: 3,
		height: 2,
		count: 8,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	baronVonBlubba: {
		width: 3,
		height: 2,
		count: 4 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	specialBubbles: {
		width: 3,
		height: 2,
		count: 12,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	lightning: {
		width: 2,
		height: 2,
		count: 1 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	fire: {
		width: 3,
		height: 2,
		count: 4 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	extendBubbles: {
		width: 3,
		height: 2,
		count: 20,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	stonerWeapon: {
		width: 3,
		height: 2,
		count: 2,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	drunkAndInvaderWeapon: {
		width: 2,
		height: 2,
		count: 5 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	incendoWeapon: {
		width: 2,
		height: 2,
		count: 4 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	items: {
		width: 2,
		height: 2,
		count: 58,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	largeLightning: {
		width: 5,
		height: 2,
		count: 1 * 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	bonusRoundCircles: {
		width: 2,
		height: 2,
		count: 3,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	flowingWater: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	fireOnGroundA: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	fireOnGround: {
		width: 1,
		height: 1,
		count: 2,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	secretLevelPlatform: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	secretLevelSideDecor: {
		width: 2,
		height: 2,
		count: 1,
		hasMask: false,
		transposed: true,
		multicolor: true,
	},
	secretLevelPedestal: {
		width: 7,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	secretLevelPedestalRightEdge: {
		width: 1,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	secretLevelPedestalDoor: {
		width: 2,
		height: 2,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	secretLevelBasementDoor: {
		width: 3,
		height: 2,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	shadows: {
		width: 1,
		height: 1,
		count: 6,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	fontHurryUp: {
		width: 9,
		height: 1,
		count: 2,
		hasMask: true,
		transposed: false,
		multicolor: true,
	},
	fontLevelNumbers6px: {
		width: 1,
		height: 6,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: true,
	},
	fontNumeric: {
		width: 10,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: false,
	},
	fontFatneck: {
		width: 11,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: false,
	},
	fontLifeDotLines: {
		width: 1,
		height: 1,
		count: 2,
		hasMask: false,
		transposed: false,
		multicolor: false,
	},
	fontAlpha: {
		width: 26,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: false,
	},
	fontPunctuation: {
		width: 1,
		height: 1,
		count: 5,
		hasMask: false,
		transposed: false,
		multicolor: false,
	},
	fontRuddyHelloThere: {
		width: 30,
		height: 1,
		count: 1,
		hasMask: false,
		transposed: false,
		multicolor: false,
	},
} as const satisfies Record<
	CharSegmentName,
	{
		readonly width: number;
		readonly height: number;
		readonly count: number;
		readonly hasMask: boolean;
		readonly transposed: boolean;
		readonly multicolor: boolean;
	}
>;

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
