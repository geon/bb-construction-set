import { SpecialBubbleName } from "../../bb/internal-data-formats/bubble-spawns";
import { Level } from "../../bb/internal-data-formats/level";
import { LevelIndex, Levels } from "../../bb/internal-data-formats/levels";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { ButtonRow } from ".././ButtonRow";
import { CheckboxList } from ".././CheckboxList";
import { ClickDragCanvasDragEventHandlers } from ".././ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from ".././ClickDragCanvasEventHandlerProvider";
import { Setter } from ".././types";

export const SpawnBubbles: ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: LevelIndex;
	levels: Levels;
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
				selected={props.levels[props.levelIndex].bubbleSpawns}
				setSelected={(bubbleSpawns) =>
					props.setLevel({ ...props.levels[props.levelIndex], bubbleSpawns })
				}
				disabled={
					props.levels[props.levelIndex].bubbleSpawns.extend
						? {}
						: {
								lightning: true,
								fire: true,
								water: true,
						  }
				}
			/>
		</ButtonRow>
	);
