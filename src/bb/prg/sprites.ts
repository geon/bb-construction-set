import {
	groupBy,
	mapRecord,
	objectFromEntries,
	range,
	strictChunk,
	sum,
} from "../functions";
import { PaletteIndex } from "../palette";
import {
	characterNames,
	Sprite,
	SpriteGroupName,
	getCharacterOffsetInSprites,
	spriteGroupLocations,
	SpriteGroup,
	isCharacterName,
	SpriteGroupLocation,
	spriteColors,
} from "../sprite";
import { Tuple } from "../tuple";
import {
	spriteDataSegmentLocations,
	SpriteDataSegmentName,
	spriteDataSegmentNames,
} from "./data-locations";
import { DataSegment } from "./io";
import { ReadonlyUint8Array } from "./types";

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

	return _parseSpriteGroupsFromBuffers(
		spriteSegments,
		spriteColorsSegment,
		spriteColors.player
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
	monsterColorSegment: DataSegment,
	playerColor: PaletteIndex
): Record<SpriteGroupName, SpriteGroup> {
	return _parseSpriteGroupsFromBuffers(
		mapRecord(spriteSegments, (x) => x.buffer),
		monsterColorSegment.buffer,
		playerColor
	);
}

function _parseSpriteGroupsFromBuffers(
	spriteSegments: Record<SpriteDataSegmentName, ReadonlyUint8Array>,
	monsterColorSegment: ReadonlyUint8Array,
	playerColor: PaletteIndex
): Record<SpriteGroupName, SpriteGroup> {
	const characterColors = [
		playerColor,
		...monsterColorSegment,
	] as PaletteIndex[];

	const characterSpriteColors = objectFromEntries(
		characterNames.map((name, characterIndex) => [
			name,
			characterColors[characterIndex]!,
		])
	);

	const spritesBySegment = mapRecord(spriteSegments, (segment, _segmentName) =>
		strictChunk([...segment], 64)
			.map((withPadding) => withPadding.slice(0, -1) as Tuple<number, 63>)
			.map((bitmap): Sprite => ({ bitmap }))
	);

	const hardCodedGroupColors: Partial<Record<SpriteGroupName, PaletteIndex>> = {
		bonusDiamond: 3,
		bonusCupCake: 8,
	};

	const spriteGroups = mapRecord(
		spriteGroupLocations,
		(location, groupName): SpriteGroup => {
			const color = isCharacterName(groupName)
				? characterSpriteColors[groupName]
				: hardCodedGroupColors[groupName] ?? playerColor;

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
