import { mapRecord, objectFromEntries, sum } from "../functions";
import { characterNames } from "../game-definitions/character-name";
import {
	spriteDataSegmentNames,
	SpriteDataSegmentName,
} from "../game-definitions/sprite-segment-name";
import { PaletteIndex } from "../internal-data-formats/palette";
import { SpriteGroupName, SpriteGroup } from "../sprite";
import { spriteDataSegmentLocations } from "../prg/data-locations";
import { parseSpritesFromBuffer, getSpriteGroupColor } from "../prg/sprites";

export function convertSpriteGroupsToBinFile(
	spriteGroups: Record<SpriteGroupName, SpriteGroup>
): Uint8Array {
	return new Uint8Array(
		spriteDataSegmentNames.flatMap((spriteGroupName): number[] => {
			const multicolorBit = 0b10000000;
			const spriteGroup = spriteGroups[spriteGroupName];
			return spriteGroup.sprites.flatMap((sprite): number[] => [
				...sprite.bitmap,
				multicolorBit | spriteGroup.color,
			]);
		})
	);
}

export function parseSpriteGroupsFromBin(
	binFileContents: Uint8Array
): Record<SpriteGroupName, SpriteGroup> {
	const spriteSegments = mapRecord(
		spriteDataSegmentLocations,
		({ length }, segmentName) => {
			const offset = getSpriteDataSegmentOffsetInBin(segmentName);
			return new Uint8Array(binFileContents.buffer, offset, length);
		}
	);

	const characterSpriteColors = objectFromEntries(
		characterNames
			// The player color is not included in the segment.
			.slice(1)
			.map((name) => {
				const segment = spriteSegments[name];
				const colorByte = segment[63];

				if (colorByte === undefined) {
					throw new Error(`Missing color byte ${name}.`);
				}

				const color = (colorByte & 0b00001111) as PaletteIndex;

				return [name, color];
			})
	);

	return mapRecord(
		spriteSegments,
		(segment, groupName): SpriteGroup => ({
			sprites: parseSpritesFromBuffer(segment),
			color: getSpriteGroupColor(groupName, characterSpriteColors),
		})
	);
}
function getSpriteDataSegmentOffsetInBin(
	segmentName: SpriteDataSegmentName
): number {
	// Sum up the length of all segments before the wanted one.
	return sum(
		spriteDataSegmentNames
			.slice(0, spriteDataSegmentNames.indexOf(segmentName))
			.map((segmentName) => spriteDataSegmentLocations[segmentName].length)
	);
}
