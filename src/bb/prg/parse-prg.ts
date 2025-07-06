import { mapRecord } from "../functions";
import { getDataSegments, getDataSegment, applyPatch } from "./io";
import {
	charSegmentLocations,
	itemSegmentLocations,
	largeBonusSpriteColorsSegmentLocation,
	levelSegmentLocations,
	monsterSpriteColorsSegmentLocation,
	spriteDataSegmentLocations,
} from "./data-locations";
import { getCharGroupsPatch, parseCharGroups } from "./char-groups";
import { getItemPatch as getItemsPatch, parseItems } from "./items";
import {
	getSpriteColorsPatch,
	getSpritesPatch,
	parseSpriteGroupsFromPrg,
} from "./sprites";
import { ParsedPrg } from "../internal-data-formats/parsed-prg";
import { readLevels, getLevelsPatch } from "./levels";

export function parsePrg(prg: ArrayBuffer): ParsedPrg {
	const levels = readLevels(getDataSegments(prg, levelSegmentLocations));
	const sprites = parseSpriteGroupsFromPrg(
		getDataSegments(prg, spriteDataSegmentLocations),
		getDataSegment(prg, monsterSpriteColorsSegmentLocation),
		getDataSegment(prg, largeBonusSpriteColorsSegmentLocation)
	);
	const chars = parseCharGroups(getDataSegments(prg, charSegmentLocations));
	const items = parseItems(
		mapRecord(itemSegmentLocations, (sublocations) =>
			getDataSegments(prg, sublocations)
		)
	);

	return { levels, sprites, chars, items };
}

export function patchPrg(prg: ArrayBuffer, parsedPrg: ParsedPrg): ArrayBuffer {
	const {
		levels,
		sprites: spriteGroups,
		chars: charGroups,
		items: itemGroups,
	} = parsedPrg;

	const levelPatch = getLevelsPatch(levels);

	const spritePatch = getSpritesPatch(spriteGroups);

	const spriteColorsPatch = getSpriteColorsPatch(spriteGroups);

	const charPatch = getCharGroupsPatch(charGroups);

	const itemPatch = getItemsPatch(itemGroups);

	return applyPatch(
		prg,
		[
			//
			levelPatch,
			spritePatch,
			spriteColorsPatch,
			charPatch,
			itemPatch,
		].flat()
	);
}
