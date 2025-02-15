import { strictChunk } from "../functions";
import {
	Sprites,
	characterNames,
	CharacterName,
	spriteCounts,
	Sprite,
} from "../sprite";
import { SpriteDataSegmentName } from "./data-locations";
import { DataSegment } from "./io";

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
