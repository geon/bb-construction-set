import { mapRecord, objectFromEntries, sum } from "../functions";
import { monsterNames } from "../game-definitions/character-name";
import { largeBonusSpriteGroupNames } from "../game-definitions/large-bonus-name";
import {
	spriteGroupNames,
	SpriteGroupName,
} from "../game-definitions/sprite-segment-name";
import { PaletteIndex } from "../internal-data-formats/palette";
import { SpriteGroup, SpriteGroups } from "../internal-data-formats/sprite";
import { spriteDataSegmentLocations } from "../prg/data-locations";
import {
	parseSprites,
	getSpriteGroupColor,
	serializeSprite,
} from "../prg/sprites";

export function serializeSpriteGroups(spriteGroups: SpriteGroups): Uint8Array {
	return new Uint8Array(
		spriteGroupNames.flatMap((spriteGroupName): number[] => {
			const multicolorBit = 0b10000000;
			const spriteGroup = spriteGroups[spriteGroupName];
			return spriteGroup.sprites.flatMap((sprite): number[] => [
				...serializeSprite(sprite),
				multicolorBit | spriteGroup.color,
			]);
		}),
	);
}

export function parseSpriteGroups(binFileContents: Uint8Array): SpriteGroups {
	const spriteSegments = mapRecord(
		spriteDataSegmentLocations,
		({ length }, segmentName) => {
			const offset = getSpriteDataSegmentOffsetInBin(segmentName);
			return new Uint8Array(binFileContents.buffer, offset, length);
		},
	);

	const characterSpriteColors = objectFromEntries(
		monsterNames.map((name) => {
			const segment = spriteSegments[name];
			const colorByte = segment[63];

			if (colorByte === undefined) {
				throw new Error(`Missing color byte ${name}.`);
			}

			const color = (colorByte & 0b00001111) as PaletteIndex;

			return [name, color];
		}),
	);

	const largeBonusSpriteColors = mapRecord(
		largeBonusSpriteGroupNames,
		(segmentName) => {
			const segment = spriteSegments[segmentName];
			const colorByte = segment[63];

			if (colorByte === undefined) {
				throw new Error(`Missing color byte ${segmentName}.`);
			}

			const color = (colorByte & 0b00001111) as PaletteIndex;

			return color;
		},
	);

	return mapRecord(
		spriteSegments,
		(segment, groupName): SpriteGroup => ({
			sprites: parseSprites([...segment]),
			color: getSpriteGroupColor(
				groupName,
				characterSpriteColors,
				largeBonusSpriteColors,
			),
		}),
	);
}

function getSpriteDataSegmentOffsetInBin(segmentName: SpriteGroupName): number {
	// Sum up the length of all segments before the wanted one.
	return sum(
		spriteGroupNames
			.slice(0, spriteGroupNames.indexOf(segmentName))
			.map((segmentName) => spriteDataSegmentLocations[segmentName].length),
	);
}
