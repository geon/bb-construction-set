import {
	mapRecord,
	objectEntries,
	objectFromEntries,
	strictChunk,
} from "../functions";
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
import { assertTuple, mapTuple } from "../tuple";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { DataSegment } from "./io";
import { ReadonlyUint8Array } from "../types";
import {
	spriteSizeBytes,
	spriteWidthBytes,
	spriteSizePixels,
} from "../../c64/consts";
import {
	parseColorPixelByte,
	serializeColorPixelByte,
} from "../internal-data-formats/color-pixel-byte";
import { spriteMasks } from "./data-locations";
import {
	LargeBonusName,
	largeBonusSpriteGroupNames,
	largeBonusSpriteGroupNames_inverse,
} from "../game-definitions/large-bonus-name";

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
	monsterColorSegment: DataSegment,
	largeBonusColorSegment: DataSegment
): SpriteGroups {
	const characterSpriteColors = parseCharacterSpriteColorsFromBuffer(
		monsterColorSegment.buffer
	);
	const largeBonusColors = parseLargeBonusSpriteColorsFromBuffer(
		largeBonusColorSegment.buffer
	);

	return mapRecord(
		mapRecord(spriteSegments, (x) => x.buffer),
		(segment, groupName): SpriteGroup => {
			const mask = spriteMasks[groupName];
			return {
				sprites: parseSprites(
					[...segment].map((byte, byteIndex) =>
						mask?.[byteIndex % mask?.length] !== false ? byte : 0
					)
				),
				color: getSpriteGroupColor(
					groupName,
					characterSpriteColors,
					largeBonusColors
				),
			};
		}
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

function parseLargeBonusSpriteColorsFromBuffer(
	largeBonusColorSegment: ReadonlyUint8Array
): Record<LargeBonusName, PaletteIndex> {
	return objectFromEntries(
		objectEntries(largeBonusSpriteGroupNames)
			.map(([key]) => key)
			.map((name, index) => [
				name,
				largeBonusColorSegment[index]! as PaletteIndex,
			])
	);
}

export function parseSprite(spriteBytes: ReadonlyArray<number>): Sprite {
	return assertTuple(
		strictChunk(spriteBytes, spriteWidthBytes).map((byteRow) =>
			assertTuple(byteRow.flatMap(parseColorPixelByte), spriteSizePixels.x)
		),
		spriteSizePixels.y
	);
}

export function serializeSprite(sprite: Sprite): ReadonlyArray<number> {
	return assertTuple(
		sprite.flatMap((row) =>
			mapTuple(strictChunk(row, 4), serializeColorPixelByte)
		),
		spriteSizeBytes
	);
}

export function parseSprites(
	segment: ReadonlyArray<number>
): ReadonlyArray<Sprite> {
	return strictChunk(segment, 64)
		.map((withPadding) => withPadding.slice(0, -1))
		.map(parseSprite);
}

export function getSpriteGroupColor(
	groupName: SpriteGroupName,
	characterSpriteColors: Partial<Record<SpriteGroupName, PaletteIndex>>,
	largeBonusSpriteColors: Record<LargeBonusName, PaletteIndex>
) {
	return (
		characterSpriteColors[groupName] ??
		largeBonusSpriteColors[largeBonusSpriteGroupNames_inverse[groupName]!] ??
		hardcodedPlayerColor
	);
}
