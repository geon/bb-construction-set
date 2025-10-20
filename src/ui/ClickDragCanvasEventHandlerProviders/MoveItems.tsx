import { useState } from "react";
import { objectEntries } from "../../bb/functions";
import { PerLevelItemSpawnPositions } from "../../bb/internal-data-formats/item-spawn-positions";
import { Level } from "../../bb/internal-data-formats/level";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { ItemCategoryName } from "../../bb/prg/data-locations";
import { Coord2, subtract, floor, add, equal, scale } from "../../math/coord2";
import { rectContainsPoint } from "../../math/rect";
import { ClickDragCanvasDragEventHandlers } from ".././ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from ".././ClickDragCanvasEventHandlerProvider";
import { Setter } from ".././types";

export const MoveItems: ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: number;
	level: Level;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools?: React.ReactNode,
		levelEditorOptions?: LevelEditorOptions
	) => React.ReactNode;
}) => {
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
			const scaledEventCoord = scale(eventCoord, 1 / 8);
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
			const scaledEventCoord = scale(eventCoord, 1 / 8);
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
};
