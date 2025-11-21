import { mapRecord, objectEntries, range } from "../../bb/functions";
import { Coord2, floor, scale } from "../../math/coord2";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { assertTuple, mapTuple } from "../../bb/tuple";
import { levelSize } from "../../bb/game-definitions/level-size";
import { rectContainsPoint } from "../../math/rect";
import { holeRects } from "../../bb/game-definitions/holes";
import {
	getPlatformTilesAndHoles,
	getTiles,
	Tiles,
} from "../../bb/internal-data-formats/tiles";
import { useDraw } from "./use-draw";
import {
	Level,
	levelIsSymmetric,
	platformTilesSize,
} from "../../bb/internal-data-formats/level";
import { ButtonGroup } from "../ButtonGroup";
import { ButtonRow } from "../ButtonRow";
import { icons } from "../icons";

const holes = objectEntries(holeRects).flatMap(([row, holes]) =>
	objectEntries(holes).map(([side, hole]) => ({ row, side, hole }))
);

export const DrawPlatforms: ClickDragCanvasEventHandlerProvider = (props) => {
	const level = props.levels[props.levelIndex];
	const tiles = getTiles(level);
	const setTiles = (tiles: Tiles) =>
		props.setLevel({
			...level,
			...getPlatformTilesAndHoles(tiles),
		});

	const setSomeTiles = createSetSomeTiles(setTiles, tiles);

	function getDrawValue(tileCoord: Coord2) {
		return !tiles[tileCoord.y]![tileCoord.x]!;
	}

	const transformCoord = getTileCoord;
	return props.children(
		useDraw(getDrawValue, setSomeTiles, transformCoord),
		<ButtonRow $align="right">
			<ButtonGroup>
				<button
					disabled={levelIsSymmetric(level.platformTiles)}
					onClick={() =>
						props.setLevel({
							...level,
							platformTiles: assertTuple(
								level.platformTiles.map((row) => {
									const leftHalf = row.slice(0, platformTilesSize.x / 2);
									return assertTuple(
										[leftHalf, leftHalf.slice().reverse()].flat(),
										platformTilesSize.x
									);
								}),
								platformTilesSize.y
							),
						})
					}
				>
					{icons.symmetry}
				</button>
			</ButtonGroup>
			<ButtonGroup>
				<button
					onClick={() =>
						props.setLevel({
							...level,
							platformTiles: assertTuple(
								level.platformTiles.slice().reverse(),
								platformTilesSize.y
							),
							monsters: level.monsters.map((monster) => ({
								...monster,
								spawnPoint: {
									...monster.spawnPoint,
									y: levelSize.y * 8 - monster.spawnPoint.y + (42 + 4 * 8),
								},
							})),
							itemSpawnPositions: mapRecord(level.itemSpawnPositions, (q) => ({
								...q,
								y: levelSize.y - q.y - 2,
							})),
							holes: {
								top: level.holes.bottom,
								bottom: level.holes.top,
							},
						})
					}
				>
					{icons.verticalArrows}
				</button>
				<button
					onClick={() =>
						props.setLevel({
							...level,
							platformTiles: assertTuple(
								level.platformTiles.map((row) =>
									assertTuple(row.slice().reverse(), platformTilesSize.x)
								),
								platformTilesSize.y
							),
							monsters: level.monsters.map((monster) => ({
								...monster,
								spawnPoint: {
									...monster.spawnPoint,
									x: levelSize.x * 8 - monster.spawnPoint.x + (40 - 2 * 8),
								},
								facingLeft: !monster.facingLeft,
							})),
							itemSpawnPositions: mapRecord(level.itemSpawnPositions, (q) => ({
								...q,
								x: levelSize.x - q.x - 2,
							})),
							holes: {
								top: {
									left: level.holes.top.right,
									right: level.holes.top.left,
								},
								bottom: {
									left: level.holes.bottom.right,
									right: level.holes.bottom.left,
								},
							},
						})
					}
				>
					{icons.horizontalArrows}
				</button>
				<button
					onClick={() =>
						props.setLevel({
							...level,
							platformTiles: assertTuple(
								level.platformTiles.map((row) =>
									assertTuple(
										[
											row.slice(platformTilesSize.x / 2),
											row.slice(0, platformTilesSize.x / 2),
										].flat(),
										platformTilesSize.x
									)
								),
								platformTilesSize.y
							),
						})
					}
				>
					{icons.fold}
				</button>
			</ButtonGroup>
			<ButtonGroup>
				<button onClick={() => props.setLevel(scrollLevelX("left", level))}>
					{icons.arrowLeft}
				</button>
				<button onClick={() => props.setLevel(scrollLevelY("up", level))}>
					{icons.arrowUp}
				</button>
				<button onClick={() => props.setLevel(scrollLevelY("down", level))}>
					{icons.arrowDown}
				</button>
				<button onClick={() => props.setLevel(scrollLevelX("right", level))}>
					{icons.arrowRight}
				</button>
			</ButtonGroup>
		</ButtonRow>
	);
};

export function getTileCoord(eventCoord: Coord2): Coord2 {
	return floor(scale(eventCoord, 1 / 8));
}

export function createSetSomeTiles(
	setTiles: (tiles: Tiles) => void,
	tiles: Tiles
) {
	return (coords: readonly Coord2[], value: boolean) => {
		const newTiles = assertTuple(
			tiles.map((row) => assertTuple([...row], levelSize.x)),
			levelSize.y
		);

		for (const coord of coords) {
			newTiles[coord.y]![coord.x] = value;
		}

		// If the hole is touched at all, change all of it.
		for (const hole of holes) {
			if (coords.some((coord) => rectContainsPoint(hole.hole, coord))) {
				const pos = hole.hole.pos;
				// Changing only the leftmost tile would be enough for `getPlatformTilesAndHoles`,
				// but that's leaky abstraction.
				for (const x of range(hole.hole.size.x)) {
					newTiles[pos.y]![pos.x + x] = value;
				}
			}
		}

		setTiles(newTiles);
	};
}

function scrollLevelY(direction: "up" | "down", level: Level) {
	const yDirection = {
		up: -1,
		down: 1,
	}[direction];

	const newLevel = {
		...level,
		platformTiles: assertTuple(
			{
				up: () =>
					[
						level.platformTiles.slice(1),
						level.platformTiles.slice(0, 1),
					].flat(),
				down: () =>
					[
						level.platformTiles.slice(-1),
						level.platformTiles.slice(0, -1),
					].flat(),
			}[direction](),
			platformTilesSize.y
		),
		monsters: level.monsters.map((monster) => ({
			...monster,
			spawnPoint: {
				...monster.spawnPoint,
				y:
					((monster.spawnPoint.y -
						4 * 8 +
						(platformTilesSize.y + yDirection) * 8) %
						(platformTilesSize.y * 8)) +
					4 * 8,
			},
		})),
		itemSpawnPositions: mapRecord(level.itemSpawnPositions, (q) => ({
			...q,
			y: (q.y + platformTilesSize.y + yDirection) % platformTilesSize.y,
		})),
	};
	return newLevel;
}

function scrollLevelX(direction: "left" | "right", level: Level) {
	const xDirection = {
		left: -1,
		right: 1,
	}[direction];

	const newLevel = {
		...level,
		platformTiles: {
			left: () =>
				mapTuple(level.platformTiles, (row) =>
					assertTuple(
						[row.slice(1), row.slice(0, 1)].flat(),
						platformTilesSize.x
					)
				),
			right: () =>
				mapTuple(level.platformTiles, (row) =>
					assertTuple(
						[row.slice(-1), row.slice(0, -1)].flat(),
						platformTilesSize.x
					)
				),
		}[direction](),
		monsters: level.monsters.map((monster) => ({
			...monster,
			spawnPoint: {
				...monster.spawnPoint,
				x:
					((monster.spawnPoint.x -
						4 * 8 +
						(platformTilesSize.x + xDirection) * 8) %
						(platformTilesSize.x * 8)) +
					4 * 8,
			},
		})),
		itemSpawnPositions: mapRecord(level.itemSpawnPositions, (q) => ({
			...q,
			x: (q.x + platformTilesSize.x + xDirection) % platformTilesSize.x,
		})),
	};
	return newLevel;
}
