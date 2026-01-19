import {
	isDefined,
	objectEntries,
	objectFromEntries,
	sum,
	zipObject,
} from "../functions";
import { levelIsSymmetric } from "../internal-data-formats/level";
import { Levels } from "../internal-data-formats/levels";
import {
	maxAsymmetric,
	maxSidebars,
	maxMonsters,
	maxWindCurrentBytes,
} from "./data-locations";

export type ResourceName = "asymmetric" | "sidebars" | "monsters" | "wind";

export const resourceNameLabels = objectEntries({
	asymmetric: "Asymmetric Levels",
	sidebars: "Side Decor",
	monsters: "Monsters",
	wind: "Wind Bytes",
} satisfies Record<ResourceName, string>);

export type Budget = {
	readonly used: number;
	readonly max: number;
};

export function budgetBlown(budget: Budget): boolean {
	return budget.used > budget.max;
}

export type Budgets = Record<ResourceName, Budget>;

export function getBudgets(levels: Levels): Budgets {
	return objectFromEntries(
		zipObject({
			key: ["asymmetric", "sidebars", "monsters", "wind"] as const,
			getUsed: [
				getUsedAsymmetric,
				getUsedSidebars,
				getUsedMonsters,
				getUsedWindCurrentBytes,
			],
			max: [maxAsymmetric, maxSidebars, maxMonsters, maxWindCurrentBytes],
		}).map(({ key, getUsed, max }) => [key, { used: getUsed(levels), max }]),
	);
}

function getUsedAsymmetric(levels: Levels): number {
	return levels.filter((level) => !levelIsSymmetric(level.platformTiles))
		.length;
}
function getUsedSidebars(levels: Levels): number {
	return new Set(
		levels
			.map((level) => level.sidebarChars)
			.filter(isDefined)
			.map((x) => JSON.stringify(x)),
	).size;
}
function getUsedMonsters(levels: Levels): number {
	return levels.flatMap((level) => level.monsters).length;
}
function getUsedWindCurrentBytes(levels: Levels): number {
	return sum(
		levels.map((level) =>
			level.bubbleCurrentRectangles.type === "copy"
				? 1
				: 1 +
					sum(
						level.bubbleCurrentRectangles.rectangles.map(({ type }) =>
							type === "symmetry" ? 1 : 3,
						),
					),
		),
	);
}
