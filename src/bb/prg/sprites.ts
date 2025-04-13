import {
	groupBy,
	mapRecord,
	objectFromEntries,
	range,
	strictChunk,
	sum,
} from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import {
	Sprite,
	SpriteGroupName,
	getCharacterOffsetInSprites,
	spriteGroupLocations,
	SpriteGroup,
	SpriteGroupLocation,
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
	const spriteGroupNamesBySegment = groupBy(
		Object.entries(spriteGroupLocations) as [
			SpriteGroupName,
			SpriteGroupLocation
		][],
		([, { segmentName }]) => segmentName,
		([spriteGroupName]) => spriteGroupName
	);

	return new Uint8Array(
		spriteDataSegmentNames.flatMap((segmentName): number[] => {
			const spriteGroupNamesInSegment = spriteGroupNamesBySegment[segmentName];
			if (!spriteGroupNamesInSegment) {
				throw new Error("No spriteGroupsInSegment " + segmentName);
			}

			const multicolorBit = 0b10000000;
			return spriteGroupNamesInSegment.flatMap((spriteGroupName): number[] => {
				const spriteGroup = spriteGroups[spriteGroupName];
				return spriteGroup.sprites.flatMap((sprite): number[] => [
					...sprite.bitmap,
					multicolorBit | spriteGroup.color,
				]);
			});
		})
	);
}

// function spriteGroupToBinFile(spriteGroup: SpriteGroup): Uint8Array {
// 	return uint8ArrayConcatenate(
// 		spriteGroup.sprites.map((sprite) =>
// 			spriteToBinFile(sprite, spriteGroup.color)
// 		)
// 	);
// }

// function spriteToBinFile(sprite: Sprite, color: PaletteIndex): Uint8Array {
// 	return new Uint8Array([...sprite.bitmap, multicolorBit | color]);
// }

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

	const characterSprites = strictChunk([...spriteSegments.characters], 64);
	const spriteColorsSegment = new Uint8Array(
		characterNames
			// The player color is not included in the segment.
			.slice(1)
			.map((name) => {
				const offset = getCharacterOffsetInSprites(name);
				const sprite = characterSprites[offset];
				if (!sprite) {
					throw new Error(
						`Missing first sprite of ${name} at offset ${offset}.`
					);
				}
				return sprite[63] & 0b00001111;
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

function _parseSpriteGroupsFromBuffers(
	spriteSegments: Record<SpriteDataSegmentName, ReadonlyUint8Array>,
	monsterColorSegment: ReadonlyUint8Array
): Record<SpriteGroupName, SpriteGroup> {
	const characterSpriteColors =
		parseCharacterSpriteColorsFromBuffer(monsterColorSegment);

	const spritesBySegment = mapRecord(spriteSegments, parseSpritesFromBuffer);

	const hardCodedGroupColors: Partial<Record<SpriteGroupName, PaletteIndex>> = {
		bonusDiamond: 3,
		bonusCupCake: 8,
	};

	const spriteGroupColors = objectFromEntries(
		spriteGroupNames.map((groupName) => {
			const color = isCharacterName(groupName)
				? characterSpriteColors[groupName]
				: hardCodedGroupColors[groupName] ?? hardcodedPlayerColor;
			return [groupName, color];
		})
	);

	const spriteGroups = mapRecord(
		spriteGroupLocations,
		(location, groupName): SpriteGroup => {
			const color = spriteGroupColors[groupName];

			return {
				sprites: range(0, location.length).map((index): Sprite => {
					const sprite =
						spritesBySegment[location.segmentName][location.startIndex + index];
					if (!sprite) {
						throw new Error(`Missing sprite ${index} in group ${groupName}.`);
					}
					return sprite;
				}),
				color,
			};
		}
	);

	return spriteGroups;
}
