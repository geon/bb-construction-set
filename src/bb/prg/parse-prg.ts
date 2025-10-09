import { mapRecord } from "../functions";
import { getDataSegments, getDataSegment, applyPatch, Patch } from "./io";
import {
	charSegmentLocations,
	enemyDeathBonusItemIndicesSegmentLocation,
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
import {
	getEnemyDeathBonusIndicesPatch,
	parseEnemyDeathBonusIndices,
} from "./enemy-death-bonuses";

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
	const enemyDeathBonusIndices = parseEnemyDeathBonusIndices(
		getDataSegment(prg, enemyDeathBonusItemIndicesSegmentLocation)
	);

	return {
		levels,
		sprites,
		chars,
		items,
		enemyDeathBonusIndices,
	};
}

export function patchPrg(
	prg: ArrayBuffer,
	parsedPrg: ParsedPrg,
	manualPatch: Patch
): ArrayBuffer {
	return applyPatch(
		prg,
		[
			getLevelsPatch(parsedPrg.levels),
			getSpritesPatch(parsedPrg.sprites),
			getSpriteColorsPatch(parsedPrg.sprites),
			getCharGroupsPatch(parsedPrg.chars),
			getItemsPatch(parsedPrg.items),
			getEnemyDeathBonusIndicesPatch(parsedPrg.enemyDeathBonusIndices),
			manualPatch,
		].flat()
	);
}
