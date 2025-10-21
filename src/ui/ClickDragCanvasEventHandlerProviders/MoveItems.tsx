import { useState } from "react";
import { objectEntries } from "../../bb/functions";
import { PerLevelItemSpawnPositions } from "../../bb/internal-data-formats/item-spawn-positions";
import { ItemCategoryName } from "../../bb/prg/data-locations";
import { Coord2, subtract, floor, add, equal, scale } from "../../math/coord2";
import { rectContainsPoint } from "../../math/rect";
import { ClickDragCanvasEventHandlerProvider } from ".././ClickDragCanvasEventHandlerProvider";

export const MoveItems: ClickDragCanvasEventHandlerProvider = (props) => {
	const level = props.levels[props.levelIndex];
	const itemSpawnPositions = level.itemSpawnPositions;
	const setItemSpawnPositions = (
		itemSpawnPositions: PerLevelItemSpawnPositions
	) =>
		props.setLevel({
			...level,
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
