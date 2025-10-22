import { Level } from "../bb/internal-data-formats/level";
import { ClickDragCanvasDragEventHandlers } from "./ClickDragCanvas";
import { Setter } from "./types";
import { LevelEditorOptions } from "../bb/palette-image/level";
import { LevelIndex, Levels } from "../bb/internal-data-formats/levels";

export type ClickDragCanvasEventHandlerProviderChildren = (
	eventHandlers: ClickDragCanvasDragEventHandlers,
	extraTools?: React.ReactNode,
	levelEditorOptions?: LevelEditorOptions
) => React.ReactNode;

export type ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: LevelIndex;
	levels: Levels;
	setLevel: Setter<Level>;
	children: ClickDragCanvasEventHandlerProviderChildren;
}) => React.ReactNode;
