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
	Sprites,
	characterNames,
	CharacterName,
	spriteCounts,
	Sprite,
	getCharacterOffsetInSprites,
} from "../sprite";
import { Tuple } from "../tuple";
import {
	spriteDataSegmentLocations,
	SpriteDataSegmentName,
	spriteDataSegmentNames,
} from "./data-locations";
import { DataSegment, uint8ArrayConcatenate } from "./io";

export function readSprites(
	spriteSegments: Record<SpriteDataSegmentName, DataSegment>,
	monsterColorSegment: DataSegment,
	playerColor: PaletteIndex
): Sprites {
	const nameByIndex = characterNames.flatMap((name) =>
		Array<CharacterName>(spriteCounts[name]).fill(name as CharacterName)
	);

	const ungroupedSprites = strictChunk(
		[...spriteSegments.characters.buffer],
		64
	).map(
		(bitmap): Sprite => ({ bitmap: bitmap.slice(0, 63) as Tuple<number, 63> })
	);

	const sprites = groupBy(
		[...nameByIndex.entries()].map(
			([globalSpriteIndex, characterName]): readonly [
				CharacterName,
				Sprite
			] => {
				const sprite = ungroupedSprites[globalSpriteIndex];
				if (!sprite) {
					throw new Error("Bad index.");
				}
				return [characterName, sprite];
			}
		),
		([characterName]) => characterName,
		([, sprite]) => sprite
	) as unknown as Record<CharacterName, Sprite[]>;

	const characterColors = [playerColor, ...monsterColorSegment.buffer];
	const spriteColors = objectFromEntries(
		characterNames.map((name, characterIndex) => [
			name,
			characterColors[characterIndex]! as PaletteIndex,
		])
	);

	return mapRecord(sprites, (sprites, characterName) => ({
		sprites,
		color: spriteColors[characterName],
	}));
}

export function readSpritesBin(
	spriteSegments: Record<SpriteDataSegmentName, DataSegment>,
	monsterColorSegment: DataSegment,
	playerColor: PaletteIndex
): Uint8Array {
	const characterColors = [playerColor, ...monsterColorSegment.buffer];

	const characterSpriteColors = characterNames
		.map((name, characterIndex) => ({
			count: spriteCounts[name],
			color: characterColors[characterIndex]!,
		}))
		.map((charcater) => Array<number>(charcater.count).fill(charcater.color))
		.flat();

	return uint8ArrayConcatenate(
		spriteDataSegmentNames.map((segmentName) => {
			// Not doing Object.entries(dataSegments) to avoid accidentally goint out of sync with writeSpritesBin.
			const segment = spriteSegments[segmentName];
			const bufferCopy = new Uint8Array(segment.buffer).slice();

			for (const spriteIndex of range(0, bufferCopy.length / 64)) {
				const paddingByteIndex = (spriteIndex + 1) * 64 - 1;
				const multicolorBit = 0b10000000;
				const color =
					segmentName !== "characters"
						? playerColor
						: characterSpriteColors[spriteIndex]!;
				bufferCopy[paddingByteIndex] = multicolorBit | color;
			}

			return bufferCopy;
		})
	);
}

export function writeSpritesBin(binFileContents: Uint8Array): {
	readonly spriteSegments: Record<SpriteDataSegmentName, Uint8Array>;
	readonly spriteColorsSegment: Uint8Array;
} {
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
			.map((name) => getCharacterOffsetInSprites(name))
			.map((offset) => characterSprites[offset]![63] & 0b00001111)
			.flat()
	);

	return {
		spriteSegments,
		spriteColorsSegment,
	};
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
