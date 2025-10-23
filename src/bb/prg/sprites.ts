import {
	mapRecord,
	objectEntries,
	objectFromEntries,
	strictChunk,
} from "../functions";
import { palette, PaletteIndex } from "../internal-data-formats/palette";
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
import {
	SpriteGroupName,
	spriteGroupNames,
} from "../game-definitions/sprite-segment-name";
import { DataSegment, patchFromSegment, SingleBytePatch } from "./io";
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
import {
	largeBonusSpriteColorsSegmentLocation,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
	spriteMasks,
} from "./data-locations";
import {
	LargeBonusName,
	largeBonusSpriteGroupNames,
	largeBonusSpriteGroupNames_inverse,
} from "../game-definitions/large-bonus-name";

const spriteColors: Record<"player", PaletteIndex> = {
	player: palette.green,
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

export function getSpritesPatch(spriteGroups: SpriteGroups) {
	return spriteGroupNames.flatMap((segmentName) => {
		const sprites = spriteGroups[segmentName].sprites;

		return sprites.flatMap((sprite, spriteIndex) => {
			const mask = spriteMasks[segmentName];
			const spriteBytes = serializeSprite(sprite);
			const spriteOffset = spriteIndex * 64;
			const spriteStartAddress =
				spriteDataSegmentLocations[segmentName].startAddress + spriteOffset;
			return spriteBytes.map((spriteByte, byteIndex): SingleBytePatch => {
				return [
					spriteStartAddress + byteIndex,
					spriteByte,
					mask?.[byteIndex] !== false ? undefined : 0x00,
				];
			});
		});
	});
}

export function getSpriteColorsPatch(spriteGroups: SpriteGroups) {
	const spriteColorsSegment = new Uint8Array(
		characterNames
			// The player color is not included in the segment.
			.slice(1)
			.map((name) => spriteGroups[name].color)
	);

	const largeBonusColors = mapRecord(
		largeBonusSpriteGroupNames,
		(name) => spriteGroups[name].color
	);
	// Hardcoded because I don't have 3 diamonds in the sprite sheet.
	largeBonusColors.yellowDiamond = palette.yellow;
	largeBonusColors.purpleDiamond = palette.purple;
	const largeBonusColorsSegment = new Uint8Array(
		Object.values(largeBonusColors)
	);

	const spriteColorsPatch = [
		patchFromSegment(monsterSpriteColorsSegmentLocation, spriteColorsSegment),
		patchFromSegment(
			largeBonusSpriteColorsSegmentLocation,
			largeBonusColorsSegment
		),
	].flat();
	return spriteColorsPatch;
}
