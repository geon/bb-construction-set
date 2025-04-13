import { mapRecord, objectFromEntries, strictChunk, sum } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import {
	Sprite,
	SpriteGroupName,
	SpriteGroup,
	spriteColors,
	spriteGroupNames,
} from "../sprite";
import {
	CharacterName,
	characterNames,
	isCharacterName,
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

	const spriteColorsSegment = new Uint8Array(
		characterNames
			// The player color is not included in the segment.
			.slice(1)
			.map((name) => {
				const segment = spriteSegments[name];
				const colorByte = segment[63];

				if (colorByte === undefined) {
					throw new Error(`Missing color byte ${name}.`);
				}

				return colorByte & 0b00001111;
			})
	);

	return _parseSpriteGroupsFromBuffers(spriteSegments, spriteColorsSegment);
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
	return _parseSpriteGroupsFromBuffers(
		mapRecord(spriteSegments, (x) => x.buffer),
		monsterColorSegment.buffer
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
	characterSpriteColors: Record<CharacterName, PaletteIndex>
) {
	const hardCodedGroupColors: Partial<Record<SpriteGroupName, PaletteIndex>> = {
		bonusDiamond: 3,
		bonusCupCake: 8,
	};

	return isCharacterName(groupName)
		? characterSpriteColors[groupName]
		: hardCodedGroupColors[groupName] ?? hardcodedPlayerColor;
}

function _parseSpriteGroupsFromBuffers(
	spriteSegments: Record<SpriteDataSegmentName, ReadonlyUint8Array>,
	monsterColorSegment: ReadonlyUint8Array
): Record<SpriteGroupName, SpriteGroup> {
	const characterSpriteColors =
		parseCharacterSpriteColorsFromBuffer(monsterColorSegment);

	const spriteGroups = mapRecord(
		spriteSegments,
		(segment, groupName): SpriteGroup => {
			const color = getSpriteGroupColor(groupName, characterSpriteColors);
			const sprites = parseSpritesFromBuffer(segment);

			return {
				sprites,
				color,
			};
		}
	);

	return spriteGroups;
}
