import { mapRecord, objectFromEntries, strictChunk } from "../functions";
import { PaletteIndex } from "../internal-data-formats/palette";
import { spriteColors } from "../sprite";
import { Sprite, SpriteGroup } from "../internal-data-formats/sprite";
import {
	CharacterName,
	characterNames,
} from "../game-definitions/character-name";
import { Tuple } from "../tuple";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { DataSegment } from "./io";
import { ReadonlyUint8Array } from "../types";

const hardcodedPlayerColor = spriteColors.player;

export function parseSpriteGroupsFromPrg(
	spriteSegments: Record<SpriteGroupName, DataSegment>,
	monsterColorSegment: DataSegment
): Record<SpriteGroupName, SpriteGroup> {
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
	return strictChunk([...segment], 64)
		.map((withPadding) => withPadding.slice(0, -1) as Tuple<number, 63>)
		.map((bitmap): Sprite => ({ bitmap }));
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
