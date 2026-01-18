import { Setter } from "../types";
import { ButtonRow } from "../ButtonRow";
import { IntegerInput } from "../IntegerInput";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";
import { LevelIndex } from "../../bb/internal-data-formats/levels";
import { clamp } from "../../math/scalar";

export const WindEditorCopy = (props: {
	readonly sourceLevelIndex: LevelIndex;
	readonly setCopyLevelIndex: Setter<LevelIndex>;
	readonly children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools: React.ReactNode,
	) => React.ReactNode;
}) => {
	return props.children(
		{},
		<ButtonRow $align="right">
			<label>
				Use rectangles from level:{" "}
				<IntegerInput
					value={props.sourceLevelIndex + 1}
					onChange={(levelNumber) =>
						props.setCopyLevelIndex(clamp(levelNumber - 1, 0, 99) as LevelIndex)
					}
				/>
			</label>
		</ButtonRow>,
	);
};
