import { objectFromEntries, zipObject } from "../functions";
import { validItemCategoryNames } from "../prg/data-locations";
import { assertTuple, mapTuple, Tuple } from "../tuple";
import { OneOrMore } from "../types";
import { validSpecialBubbleNames } from "./bubble-spawns";
import { Level, PlatformTiles, platformTilesSize } from "./level";
import { Levels } from "./levels";

function randomInteger(toNotIncluding: number) {
	return Math.floor(Math.random() * toNotIncluding);
}

function randomElement<T>(array: OneOrMore<T>): T {
	return array[randomInteger(array.length)]!;
}

function mixArrays<T>(arrays: Tuple<readonly T[], 2>): T[] {
	return [
		arrays[0].slice(0, Math.floor(arrays[0].length / 2)),
		arrays[1].slice(-Math.ceil(arrays[1].length / 2)),
	].flat();
}

function mixArrays2(arrays: Tuple<PlatformTiles, 2>): PlatformTiles {
	const start = 4 + randomInteger(8);
	const length = 12;

	function randomReverse<T>(array: readonly T[]): readonly T[] {
		return randomInteger(2) ? array : array.slice().reverse();
	}

	function randomInsideOut<T>(array: readonly T[]): readonly T[] {
		return randomInteger(2)
			? array
			: array.map((row) => {
					if (!Array.isArray(row)) {
						throw new Error();
					}
					return [
						row.slice(platformTilesSize.x / 2),
						row.slice(0, platformTilesSize.x / 2),
					].flat() as T;
			  });
	}

	const a = randomInsideOut(randomReverse(arrays[0]));
	const b = randomInsideOut(randomReverse(arrays[1]));

	return assertTuple(
		[
			a.slice(0, start),
			b.slice(start, start + length),
			a.slice(start + length),
		].flat(),
		platformTilesSize.y
	);
}

function randomHalves(tileses: Tuple<PlatformTiles, 2>): PlatformTiles {
	return mapTuple(zipObject({ a: tileses[0], b: tileses[1] }), ({ a, b }) =>
		assertTuple(
			[
				a.slice(0, platformTilesSize.x / 2),
				b.slice(platformTilesSize.x / 2),
			].flat(),
			platformTilesSize.x
		)
	);
}

function randomizePlatformTiles(
	tileses: Tuple<PlatformTiles, 2>
): PlatformTiles {
	return Math.random() > 0.9 ? randomHalves(tileses) : mixArrays2(tileses);
}

function mixLevels(levels: Tuple<Level, 2>): Level {
	return {
		platformTiles: randomizePlatformTiles(
			mapTuple(levels, (x) => x.platformTiles)
		),
		holes: objectFromEntries(
			(["top", "bottom"] as const).map((rowName) => [
				rowName,
				randomElement(levels).holes[rowName],
			])
		),
		bgColors: {
			light: randomElement(levels).bgColors.light,
			dark: randomElement(levels).bgColors.dark,
		},
		platformChar: mixArrays(mapTuple(levels, (x) => x.platformChar)) as any,
		sidebarChars: undefined,
		monsters: mixArrays(mapTuple(levels, (x) => x.monsters)) as any,
		bubbleCurrentRectangles: {
			type: "rectangles",
			rectangles: [],
		},
		bubbleCurrentPerLineDefaults: mixArrays(
			mapTuple(levels, (x) => x.bubbleCurrentPerLineDefaults)
		) as any,
		bubbleSpawns: objectFromEntries(
			validSpecialBubbleNames.map((name) => [
				name,
				randomElement(levels).bubbleSpawns[name],
			])
		),
		itemSpawnPositions: objectFromEntries(
			validItemCategoryNames.map((name) => [
				name,
				randomElement(levels).itemSpawnPositions[name],
			])
		),
	};
}

export function randomizeLevel(levels: Levels): Level {
	return mixLevels([randomElement(levels), randomElement(levels)]);
}
