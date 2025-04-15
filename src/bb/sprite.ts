import { sum } from "./functions";
import { PaletteIndex } from "./internal-data-formats/palette";
import {
	CharacterName,
	characterNames,
} from "./game-definitions/character-name";
import { Sprite } from "./internal-data-formats/sprite";

export type Sprites = Record<
	CharacterName,
	{
		readonly sprites: readonly Sprite[];
		readonly color: PaletteIndex;
	}
>;

export const spriteCounts: Record<CharacterName, number> = {
	player: 19,
	bubbleBuster: 12,
	incendo: 12,
	colley: 12,
	hullaballoon: 8,
	beluga: 12,
	willyWhistle: 8,
	stoner: 8,
	superSocket: 6,
};

export const spriteLeftIndex: Record<CharacterName, number> = {
	player: 4,
	bubbleBuster: 4,
	incendo: 4,
	colley: 4,
	hullaballoon: 2,
	beluga: 4,
	willyWhistle: 2,
	stoner: 2,
	superSocket: 1,
};

export const spriteColors: Record<"player", PaletteIndex> = {
	player: 5,
	// bubbleBuster: 12,
	// incendo: 15,
	// colley: 5,
	// hullaballoon: 13,
	// beluga: 4,
	// willyWhistle: 5,
	// stoner: 3,
	// superSocket: 15,
};

export function getCharacterOffsetInSprites(
	characterName: CharacterName
): number {
	// Sum up the length of all segments before the wanted one.
	return sum(
		characterNames
			.slice(0, characterNames.indexOf(characterName))
			.map((characterName) => spriteCounts[characterName])
	);
}
