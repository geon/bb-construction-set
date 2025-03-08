import { range, strictChunk } from "../functions";
import {
	Sprites,
	characterNames,
	CharacterName,
	spriteCounts,
	Sprite,
	spriteColors,
} from "../sprite";
import { SpriteDataSegmentName } from "./data-locations";
import { DataSegment, uint8ArrayConcatenate } from "./io";

export function readSprites(
	dataSegments: Record<SpriteDataSegmentName, DataSegment>
): Sprites {
	const sprites: Sprites = {
		player: [],
		bubbleBuster: [],
		incendo: [],
		colley: [],
		hullaballoon: [],
		beluga: [],
		willyWhistle: [],
		stoner: [],
		superSocket: [],
	};

	const nameByIndex = characterNames.flatMap((name) =>
		Array<CharacterName>(spriteCounts[name]).fill(name as CharacterName)
	);

	const spriteBitmaps = strictChunk([...dataSegments.characters.buffer], 64);

	for (const [globalSpriteIndex, characterName] of nameByIndex.entries()) {
		const sprite: Sprite = {
			bitmap: spriteBitmaps[globalSpriteIndex].slice(0, 63),
		};
		sprites[characterName].push(sprite);
	}
	return sprites;
}

export function readSpritesBin(
	dataSegments: Record<SpriteDataSegmentName, DataSegment>
): Uint8Array {
	const characterSpriteColors = characterNames
		.map((name) => ({
			count: spriteCounts[name],
			color: spriteColors[name],
		}))
		.map((charcater) => Array<number>(charcater.count).fill(charcater.color))
		.flat();

	return uint8ArrayConcatenate(
		(
			Object.entries(dataSegments) as [SpriteDataSegmentName, DataSegment][]
		).map(([segmentName, segment]) => {
			const bufferCopy = new Uint8Array(segment.buffer).slice();

			for (const spriteIndex of range(0, bufferCopy.length / 64)) {
				const paddingByteIndex = (spriteIndex + 1) * 64 - 1;
				const multicolorBit = 0b10000000;
				const color =
					segmentName !== "characters"
						? spriteColors.player
						: characterSpriteColors[spriteIndex];
				bufferCopy[paddingByteIndex] = multicolorBit | color;
			}

			return bufferCopy;
		})
	);
}
