import { BubbleCurrentRectangleOrSymmetry } from "../../bb/internal-data-formats/level";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { WindEditorCopy } from "./WindEditorCopy";
import { WindEditorRectangles } from "./WindEditorRectangles";
import { Flex } from "../Flex";
import { ButtonRow } from "../ButtonRow";
import { icons } from "../icons";
import { ButtonGroup } from "../ButtonGroup";
import { RadioButton } from "../RadioButton";
import { useState } from "react";
import { checkedAccess } from "../../bb/functions";
import { LevelIndex } from "../../bb/internal-data-formats/levels";
import { Setter } from "../types";
import { WindEditorPerLineDefaults } from "./WindEditorPerLineDefaults";

export const WindEditor: ClickDragCanvasEventHandlerProvider = (props) => {
	const level = props.levels[props.levelIndex];

	function setCopyLevelIndex(levelIndex: LevelIndex): void {
		props.setLevel({
			...level,
			...checkedAccess(props.levels, props.levelIndex),
			bubbleCurrentRectangles: {
				type: "copy",
				levelIndex,
			},
		});
	}

	function setRectangles(
		rectangles: readonly BubbleCurrentRectangleOrSymmetry[],
	): void {
		props.setLevel({
			...level,
			bubbleCurrentRectangles: {
				type: "rectangles",
				rectangles,
			},
		});
	}

	const [showPerLineDefaults, setShowPerLineDefaults] =
		useState<boolean>(false);

	return showPerLineDefaults ? (
		<WindEditorPerLineDefaults
			setPerLineDefaults={(bubbleCurrentPerLineDefaults) =>
				props.setLevel({
					...level,
					bubbleCurrentPerLineDefaults,
				})
			}
			perLineDefaults={level.bubbleCurrentPerLineDefaults}
			children={(eventHandlers) =>
				props.children(
					eventHandlers,
					<ChildContent
						showPerLineDefaults={showPerLineDefaults}
						setShowPerLineDefaults={setShowPerLineDefaults}
						type={level.bubbleCurrentRectangles.type}
						setCopyLevelIndex={setCopyLevelIndex}
						setRectangles={setRectangles}
					/>,
					{ type: "wind-editor" },
				)
			}
		/>
	) : level.bubbleCurrentRectangles.type === "copy" ? (
		<WindEditorCopy
			sourceLevelIndex={level.bubbleCurrentRectangles.levelIndex}
			setCopyLevelIndex={setCopyLevelIndex}
			children={(eventHandlers, extraTools) =>
				props.children(
					eventHandlers,
					<ChildContent
						type={level.bubbleCurrentRectangles.type}
						showPerLineDefaults={showPerLineDefaults}
						setShowPerLineDefaults={setShowPerLineDefaults}
						setCopyLevelIndex={setCopyLevelIndex}
						setRectangles={setRectangles}
						extraTools={extraTools}
					/>,
					{ type: "wind-editor" },
				)
			}
		/>
	) : (
		<WindEditorRectangles
			levelIndex={props.levelIndex}
			rectangles={level.bubbleCurrentRectangles.rectangles}
			setRectangles={setRectangles}
			children={(eventHandlers, extraTools, rectsList, levelEditorOptions) =>
				props.children(
					eventHandlers,
					<ChildContent
						showPerLineDefaults={showPerLineDefaults}
						setShowPerLineDefaults={setShowPerLineDefaults}
						type={level.bubbleCurrentRectangles.type}
						setCopyLevelIndex={setCopyLevelIndex}
						setRectangles={setRectangles}
						extraTools={extraTools}
						rectsList={rectsList}
					/>,
					{ ...levelEditorOptions },
				)
			}
		/>
	);
};

function ChildContent(props: {
	type: "copy" | "rectangles";
	showPerLineDefaults: boolean;
	setShowPerLineDefaults: Setter<boolean>;
	setCopyLevelIndex: (levelIndex: LevelIndex) => void;
	setRectangles(rectangles: readonly BubbleCurrentRectangleOrSymmetry[]): void;
	extraTools?: React.ReactNode;
	rectsList?: React.ReactNode;
}) {
	return (
		<Flex $col>
			<ButtonRow>
				<ButtonGroup>
					<RadioButton
						$active={props.showPerLineDefaults}
						onClick={() => props.setShowPerLineDefaults(true)}
					>
						{icons.back}
					</RadioButton>
					<RadioButton
						$active={!props.showPerLineDefaults}
						onClick={() => props.setShowPerLineDefaults(false)}
					>
						{icons.front}
					</RadioButton>
				</ButtonGroup>
				{props.showPerLineDefaults ? undefined : (
					<ButtonGroup $align="left">
						<RadioButton
							$active={props.type === "rectangles"}
							onClick={() => props.setRectangles([])}
						>
							{icons.grid1x2}
						</RadioButton>
						<RadioButton
							$active={props.type === "copy"}
							onClick={() =>
								confirm("Switching to copy-mode deletes all rectangles.") &&
								props.setCopyLevelIndex(0)
							}
						>
							{icons.link}
						</RadioButton>
					</ButtonGroup>
				)}
				{props.extraTools}
			</ButtonRow>
			{props.rectsList}
		</Flex>
	);
}
