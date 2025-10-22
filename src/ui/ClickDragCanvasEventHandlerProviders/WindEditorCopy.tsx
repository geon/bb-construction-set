import { Setter } from "../types";
import { ButtonRow } from "../ButtonRow";
import { IntegerInput } from "../IntegerInput";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";
import { LevelIndex } from "../../bb/internal-data-formats/levels";

export const WindEditorCopy = (props: {
	readonly sourceLevelIndex: LevelIndex;
	readonly setCopyLevelIndex: Setter<LevelIndex>;
	readonly children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools: React.ReactNode
	) => React.ReactNode;
}) => {
	return props.children(
		{},
		<ButtonRow $align="right">
			<label>
				Copy winds from level:{" "}
				<IntegerInput
					value={props.sourceLevelIndex + 1}
					onChange={(levelNumber) =>
						props.setCopyLevelIndex((levelNumber - 1) as LevelIndex)
					}
				/>
			</label>
		</ButtonRow>
	);
};
