import { groupBy, isDefined, mapRecord, unzipObject } from "../bb/functions";
import {
	createState,
	getRandomItemIndices,
	initializeRandomSeedForFirstLevel,
} from "../bb/game-definitions/rng";
import { itemNames, itemSegmentLocations } from "../bb/prg/data-locations";

export function range(length: number, from: number = 0): ReadonlyArray<number> {
	return Array(length)
		.fill(undefined)
		.map((_, index) => index + from);
}

const frameMin = 25;
const frameMax = 200;
const itemIndices = range(frameMax - frameMin).map((index) => {
	console.time();
	const state = createState();
	initializeRandomSeedForFirstLevel(state, index + frameMin);
	const items = getRandomItemIndices(state);
	console.timeEnd();
	console.log(index);

	return items;
});

const distributions = mapRecord(unzipObject(itemIndices), (indices) =>
	mapRecord(
		groupBy(indices, (x) => x.toString()),
		(x) => x?.length ?? 0
	)
);

mapRecord(distributions, (distribution, itemsCategoryName) => {
	console.log(itemsCategoryName);

	const allIndices = range(
		(
			{
				points: itemSegmentLocations.points.charBlockIndices.length,
				// 3 of the 35 items are special.
				powerups: itemSegmentLocations.powerups.charBlockIndices.length - 3,
			} as const
		)[itemsCategoryName]
	);

	const distributionMinMax = {
		min: Math.min(...Object.values(distribution).filter(isDefined)),
		max: Math.max(...Object.values(distribution).filter(isDefined)),
	};

	console.log("distribution");
	console.table(
		allIndices.map((itemIndex) => [
			itemNames[itemsCategoryName][itemIndex],
			range(
				Math.ceil(
					((distribution[itemIndex] ?? 0) / distributionMinMax.max) * 20
				)
			)
				.map(() => "*")
				.join(""),
		])
	);
	console.log(
		"distribution min/max",
		distributionMinMax.min,
		distributionMinMax.max
	);
	const allIndicesSet = new Set(allIndices);
	console.log(
		"missing",
		Object.keys(distribution)
			.map((x) => parseInt(x, 10))
			.filter((x) => !allIndicesSet.has(x))
	);
});
