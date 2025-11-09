import { range } from "../../bb/functions";
import { Level } from "../../bb/internal-data-formats/level";
import { LevelIndex, Levels } from "../../bb/internal-data-formats/levels";
import { PaletteIndex } from "../../bb/internal-data-formats/palette";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { ButtonRow } from "../ButtonRow";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { Palette } from "../Palette";
import { Setter } from "../types";

export const PlatformGraphics: ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: LevelIndex;
	levels: Levels;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools?: React.ReactNode,
		levelEditorOptions?: LevelEditorOptions
	) => React.ReactNode;
}) => {
	const level = props.levels[props.levelIndex];

	return props.children(
		{},
		(
			[
				["light", "Light"],
				["dark", "Dark"],
			] as const
		).map(([shade, label]) => (
			<ButtonRow key={shade} $align="right">
				<span>{label}:</span>
				<Palette
					selectedOptionIndex={level.bgColors[shade]}
					options={range(16) as readonly PaletteIndex[]}
					onPick={(paletteIndex) => {
						props.setLevel({
							...level,
							bgColors: { ...level.bgColors, [shade]: paletteIndex },
						});
					}}
				/>
			</ButtonRow>
		))
	);
};
