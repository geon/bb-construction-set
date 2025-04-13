import { mapRecord, objectFromEntries, strictChunk, sum } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import { Sprite, SpriteGroupName, SpriteGroup, spriteColors } from "../sprite";
import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import { Tuple } from "../tuple";
import { spriteDataSegmentLocations } from "./data-locations";
import {
	SpriteDataSegmentName,
	spriteDataSegmentNames,
} from "../game-definitions/sprite-segment-name";
import { DataSegment } from "./io";
import { ReadonlyUint8Array } from "../types";

const hardcodedPlayerColor = spriteColors.player;

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

export function parseSpriteGroupsFromPrg(
	spriteSegments: Record<SpriteDataSegmentName, DataSegment>,
	monsterColorSegment: DataSegment
): Record<SpriteGroupName, SpriteGroup> {
	const characterSpriteColors = parseCharacterSpriteColorsFromBuffer(
		monsterColorSegment.buffer
	);

	return mapRecord(
		mapRecord(spriteSegments, (x) => x.buffer),
		(segment, groupName): SpriteGroup => ({
			sprites: parseSpritesFromBuffer(segment),
			color: getSpriteGroupColor(groupName, characterSpriteColors),
		})
	);
}

function parseCharacterSpriteColorsFromBuffer(
	monsterColorSegment: ReadonlyUint8Array
): Record<CharacterName, PaletteIndex> {
	const characterColors = [
		hardcodedPlayerColor,
		...monsterColorSegment,
	] as PaletteIndex[];

	const characterSpriteColors = objectFromEntries(
		characterNames.map((name, characterIndex) => [
			name,
			characterColors[characterIndex]!,
		])
	);

	return characterSpriteColors;
}

function parseSpritesFromBuffer(
	segment: ReadonlyUint8Array
): ReadonlyArray<Sprite> {
	return strictChunk([...segment], 64)
		.map((withPadding) => withPadding.slice(0, -1) as Tuple<number, 63>)
		.map((bitmap): Sprite => ({ bitmap }));
}

function getSpriteGroupColor(
	groupName: SpriteGroupName,
	characterSpriteColors: Partial<Record<SpriteGroupName, PaletteIndex>>
) {
	const hardCodedGroupColors: Partial<Record<SpriteGroupName, PaletteIndex>> = {
		bonusDiamond: 3,
		bonusCupCake: 8,
	};

	return (
		characterSpriteColors[groupName] ??
		hardCodedGroupColors[groupName] ??
		hardcodedPlayerColor
	);
}
