import { useState } from "react";
import { bresenham, objectEntries, updateArrayAtIndex } from "../bb/functions";
import { Level, Tiles } from "../bb/internal-data-formats/level";
import { add, Coord2, equal, floor, multiply, subtract } from "../math/coord2";
import { ClickDragCanvasDragEventHandlers } from "./ClickDragCanvas";
import { Setter } from "./types";
import { levelSize } from "../bb/game-definitions/level-size";
import { assertTuple } from "../bb/tuple";
import { PerLevelItemSpawnPositions } from "../bb/internal-data-formats/item-spawn-positions";
import { ItemCategoryName } from "../bb/prg/data-locations";
import { rectContainsPoint } from "../math/rect";
import { spritePosOffset, spriteSizePixels } from "../c64/consts";

export type ClickDragCanvasEventHandlerProvider = (props: {
	level: Level;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers
	) => React.ReactNode;
}) => React.ReactNode;

export const clickDragCanvasEventHandlerProviders = {
	"draw-platforms": (props) => {
		const tiles = props.level.tiles;
		const setTiles = (tiles: Tiles) =>
			props.setLevel({
				...props.level,
				tiles,
			});

		const setSomeTiles = createSetSomeTiles(setTiles, tiles);
		let [drawValue, setDrawValue] = useState<boolean | undefined>(undefined);
		let [lineStart, setLineStart] = useState<Coord2 | undefined>(undefined);

		return props.children({
			onClick: (eventCoord) => {
				if (drawValue === undefined) {
					return;
				}
				setSomeTiles([getTileCoord(eventCoord)], drawValue);
			},
			onDragStart: (eventCoord) => {
				const tileCoord = getTileCoord(eventCoord);
				const newDrawValue = !tiles[tileCoord.y]![tileCoord.x]!;
				setDrawValue(newDrawValue);
				setLineStart(tileCoord);
			},
			onDragEnd: () => {
				setDrawValue(undefined);
				setLineStart(undefined);
			},
			onDragUpdate: (eventCoord) => {
				if (drawValue === undefined) {
					return;
				}
				if (lineStart === undefined) {
					return;
				}
				const tileCoord = getTileCoord(eventCoord);
				if (equal(lineStart, tileCoord)) {
					return;
				}
				setSomeTiles(bresenham(lineStart, tileCoord), drawValue);
				setLineStart(tileCoord);
			},
		});
	},

	"move-items": (props) => {
		const itemSpawnPositions = props.level.itemSpawnPositions;
		const setItemSpawnPositions = (
			itemSpawnPositions: PerLevelItemSpawnPositions
		) =>
			props.setLevel({
				...props.level,
				itemSpawnPositions,
			});

		let [draggedItem, setDraggedItem] = useState<
			| {
					readonly category: ItemCategoryName;
					readonly offset: Coord2;
			  }
			| undefined
		>(undefined);

		return props.children({
			onDragStart: (eventCoord) => {
				const scaledEventCoord = multiply(eventCoord, { x: 1 / 4, y: 1 / 8 });
				const foundItem = objectEntries(itemSpawnPositions)
					.map(([category, pos]) => ({ category, pos }))
					.find(({ pos }) =>
						rectContainsPoint({ pos, size: { x: 2, y: 2 } }, scaledEventCoord)
					);

				setDraggedItem(
					foundItem && {
						category: foundItem.category,
						offset: subtract(scaledEventCoord, foundItem.pos),
					}
				);
			},
			onDragEnd: () => {
				setDraggedItem(undefined);
			},
			onDragUpdate: (eventCoord) => {
				if (!draggedItem) {
					return;
				}
				const scaledEventCoord = multiply(eventCoord, { x: 1 / 4, y: 1 / 8 });
				const newItemPosition = floor(
					add(subtract(scaledEventCoord, draggedItem.offset), {
						x: 0.5,
						y: 0.5,
					})
				);
				if (equal(itemSpawnPositions[draggedItem.category], newItemPosition)) {
					return;
				}
				setItemSpawnPositions({
					...itemSpawnPositions,
					[draggedItem.category]: newItemPosition,
				});
			},
		});
	},

	"move-enemies": (props) => {
		const monsters = props.level.monsters;
		const setMonsterPosition = (index: number, spawnPoint: Coord2) =>
			props.setLevel({
				...props.level,
				monsters: updateArrayAtIndex(monsters, index, (monster) => ({
					...monster,
					spawnPoint,
				})),
			});

		let [draggedMonster, setDraggedMonster] = useState<
			| {
					readonly index: number;
					readonly offset: Coord2;
			  }
			| undefined
		>(undefined);

		return props.children({
			onDragStart: (eventCoord) => {
				const monster = monsters
					.map(({ spawnPoint }, index) => ({
						pos: floor(
							multiply(subtract(spawnPoint, spritePosOffset), {
								x: 1 / 2,
								y: 1,
							})
						),
						index,
					}))
					.find(({ pos }) =>
						rectContainsPoint({ pos, size: spriteSizePixels }, eventCoord)
					);
				if (!monster) {
					return;
				}
				setDraggedMonster({
					index: monster.index,
					offset: subtract(eventCoord, monster.pos),
				});
			},
			onDragEnd: () => {
				setDraggedMonster(undefined);
			},
			onDragUpdate: (eventCoord) => {
				if (!draggedMonster) {
					return;
				}
				setMonsterPosition(
					draggedMonster.index,
					add(
						multiply(subtract(eventCoord, draggedMonster.offset), {
							x: 2,
							y: 1,
						}),
						spritePosOffset
					)
				);
			},
		});
	},
} as const satisfies Record<string, ClickDragCanvasEventHandlerProvider>;

function getTileCoord(eventCoord: Coord2): Coord2 {
	return floor(multiply(eventCoord, { x: 1 / 4, y: 1 / 8 }));
}

function createSetSomeTiles(setTiles: (tiles: Tiles) => void, tiles: Tiles) {
	return (coords: readonly Coord2[], value: boolean) => {
		const newTiles = assertTuple(
			tiles.map((row) => assertTuple([...row], levelSize.x)),
			levelSize.y
		);

		for (const coord of coords) {
			newTiles[coord.y]![coord.x] = value;
		}

		setTiles(newTiles);
	};
}
