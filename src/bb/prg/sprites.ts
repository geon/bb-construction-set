import {
	Sprites,
	characterNames,
	CharacterName,
	spriteCounts,
	Sprite,
	numSpriteBytes,
} from "../sprite";
import { spriteBitmapArrayAddress } from "./data-locations";
import { GetByte } from "./types";

export function readSprites(getByte: GetByte): Sprites {
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

	for (const [globalSpriteIndex, characterName] of nameByIndex.entries()) {
		const sprite = readSprite(getByte, globalSpriteIndex);
		sprites[characterName].push(sprite);
	}
	return sprites;
}

function readSprite(getByte: GetByte, spriteIndex: number): Sprite {
	const bitmap: Sprite["bitmap"] = [];
	for (let byteIndex = 0; byteIndex < numSpriteBytes; ++byteIndex) {
		bitmap.push(
			getByte(spriteBitmapArrayAddress + spriteIndex * 64 + byteIndex)
		);
	}
	return {
		bitmap,
	};
}
