import { EnemyDeathBonusIndices } from "../internal-data-formats/enemy-death-bonuses";
import { assertTuple } from "../tuple";
import { enemyDeathBonusItemIndicesSegmentLocation } from "./data-locations";
import { DataSegment, Patch, patchFromSegment } from "./io";

export function parseEnemyDeathBonusIndices(
	dataSegment: DataSegment
): EnemyDeathBonusIndices {
	return assertTuple([...dataSegment.buffer], 6);
}

export function getEnemyDeathBonusIndicesPatch(
	enemyDeathBonusIndices: EnemyDeathBonusIndices
): Patch {
	return patchFromSegment(
		enemyDeathBonusItemIndicesSegmentLocation,
		new Uint8Array(enemyDeathBonusIndices)
	);
}
