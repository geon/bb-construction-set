import { Level } from "../bb/internal-data-formats/level";
import { ClickDragCanvasDragEventHandlers } from "./ClickDragCanvas";
import { Setter } from "./types";
import { LevelEditorOptions } from "../bb/palette-image/level";

export type ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: number;
	level: Level;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools?: React.ReactNode,
		levelEditorOptions?: LevelEditorOptions
	) => React.ReactNode;
}) => React.ReactNode;
