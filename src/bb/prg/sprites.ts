import { mapRecord, objectFromEntries, strictChunk } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import {
	Sprite,
	SpriteGroup,
	SpriteGroups,
} from "../internal-data-formats/sprite";
import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import { Tuple } from "../tuple";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { DataSegment } from "./io";
import { ReadonlyUint8Array } from "../types";

const spriteColors: Record<"player", PaletteIndex> = {
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

const hardcodedPlayerColor = spriteColors.player;

export function parseSpriteGroupsFromPrg(
	spriteSegments: Record<SpriteGroupName, DataSegment>,
	monsterColorSegment: DataSegment
): SpriteGroups {
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

export function parseSpritesFromBuffer(
	segment: ReadonlyUint8Array
): ReadonlyArray<Sprite> {
	return strictChunk([...segment], 64).map(
		(withPadding): Sprite => withPadding.slice(0, -1) as Tuple<number, 63>
	);
}

export function getSpriteGroupColor(
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
