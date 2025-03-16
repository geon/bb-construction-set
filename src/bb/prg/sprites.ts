import {
	groupBy,
	mapRecord,
	objectFromEntries,
	range,
	strictChunk,
} from "../functions";
import {
	Sprites,
	characterNames,
	CharacterName,
	spriteCounts,
	Sprite,
	spriteColors,
} from "../sprite";
import {
	spriteDataSegmentLocations,
	SpriteDataSegmentName,
	spriteDataSegmentNames,
} from "./data-locations";
import { DataSegment, uint8ArrayConcatenate } from "./io";

export function readSprites(
	dataSegments: Record<SpriteDataSegmentName, DataSegment>
): Sprites {
	const nameByIndex = characterNames.flatMap((name) =>
		Array<CharacterName>(spriteCounts[name]).fill(name as CharacterName)
	);

	const ungroupedSprites = strictChunk(
		[...dataSegments.characters.buffer],
		64
	).map((bitmap): Sprite => ({ bitmap: bitmap.slice(0, 63) }));

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

	return mapRecord(sprites, (sprites) => ({ sprites }));
}

export function readSpritesBin(
	spriteSegments: Record<SpriteDataSegmentName, DataSegment>,
	monsterColorSegment: DataSegment
): Uint8Array {
	const characterColors = [spriteColors.player, ...monsterColorSegment.buffer];

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
						? spriteColors.player
						: characterSpriteColors[spriteIndex]!;
				bufferCopy[paddingByteIndex] = multicolorBit | color;
			}

			return bufferCopy;
		})
	);
}

export function writeSpritesBin(
	binFileContents: Uint8Array
): Record<SpriteDataSegmentName, Uint8Array> {
	let nextOffset = 0;
	return objectFromEntries(
		spriteDataSegmentNames.map((segmentName) => {
			const offset = nextOffset;
			const length = spriteDataSegmentLocations[segmentName].length;
			nextOffset += length;
			return [
				segmentName,
				new Uint8Array(binFileContents.buffer, offset, length),
			];
		})
	);
}
