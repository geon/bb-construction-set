import { SpecialBubbleName } from "../../bb/internal-data-formats/bubble-spawns";
import { Level } from "../../bb/internal-data-formats/level";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { ButtonRow } from ".././ButtonRow";
import { CheckboxList } from ".././CheckboxList";
import { ClickDragCanvasDragEventHandlers } from ".././ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from ".././ClickDragCanvasEventHandlerProvider";
import { Setter } from ".././types";

export const SpawnBubbles: ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: number;
	level: Level;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools?: React.ReactNode,
		levelEditorOptions?: LevelEditorOptions
	) => React.ReactNode;
}) =>
	props.children(
		{},
		<ButtonRow $align="right">
			<CheckboxList
				options={
					{
						lightning: "Lightning",
						fire: "Fire",
						water: "Water",
						extend: "Extend",
					} satisfies Record<SpecialBubbleName, string>
				}
				selected={props.level.bubbleSpawns}
				setSelected={(bubbleSpawns) =>
					props.setLevel({ ...props.level, bubbleSpawns })
				}
			/>
		</ButtonRow>
	);
