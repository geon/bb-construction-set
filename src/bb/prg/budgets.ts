import { objectEntries, objectFromEntries, zipObject } from "../functions";
import { levelIsSymmetric } from "../internal-data-formats/level";
import { Levels } from "../internal-data-formats/levels";
import { maxAsymmetric, maxSidebars, maxMonsters } from "./data-locations";

export type ResourceName = "asymmetric" | "sidebars" | "monsters";

export const resourceNameLabels = objectEntries({
	asymmetric: "Asymmetric Levels",
	sidebars: "Side Decor",
	monsters: "Monsters",
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
			key: ["asymmetric", "sidebars", "monsters"] as const,
			getUsed: [getUsedAsymmetric, getUsedSidebars, getUsedMonsters],
			max: [maxAsymmetric, maxSidebars, maxMonsters],
		}).map(({ key, getUsed, max }) => [key, { used: getUsed(levels), max }])
	);
}

function getUsedAsymmetric(levels: Levels): number {
	return levels.filter((level) => !levelIsSymmetric(level.platformTiles))
		.length;
}
function getUsedSidebars(levels: Levels): number {
	return levels.filter((level) => !!level.sidebarChars).length;
}
function getUsedMonsters(levels: Levels): number {
	return levels.flatMap((level) => level.monsters).length;
}
