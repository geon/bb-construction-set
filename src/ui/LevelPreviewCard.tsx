import { ReactNode, useState } from "react";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import { imageDataFromPaletteImage } from "../bb/image-data/image-data";
import { drawLevel } from "../bb/palette-image/level";
import { Card } from "./Card";
import styled, { css } from "styled-components";
import { drawLevels } from "../bb/image-data/draw-level";
import { objectEntries, reorder, updateArrayAtIndex } from "../bb/functions";
import { ButtonGroup } from "./ButtonGroup";
import { icons } from "./icons";
import { Setter } from "./types";
import { ClickDragCanvas } from "./ClickDragCanvas";
import { Level } from "../bb/internal-data-formats/level";
import { Flex } from "./Flex";
import { DrawPlatforms } from "./ClickDragCanvasEventHandlerProviders/DrawPlatforms";
import { MoveEnemies } from "./ClickDragCanvasEventHandlerProviders/MoveEnemies";
import { MoveItems } from "./ClickDragCanvasEventHandlerProviders/MoveItems";
import { SpawnBubbles } from "./ClickDragCanvasEventHandlerProviders/SpawnBubbles";
import { ClickDragCanvasEventHandlerProvider } from "./ClickDragCanvasEventHandlerProvider";
import { RadioButton } from "./RadioButton";
import { levelSize } from "../bb/game-definitions/level-size";
import { Coord2, divide, floor } from "../math/coord2";
import { assertTuple } from "../bb/tuple";
import { LevelIndex } from "../bb/internal-data-formats/levels";
import { WindEditor } from "./ClickDragCanvasEventHandlerProviders/WindEditor";
import {
	Budget,
	budgetBlown,
	Budgets,
	resourceNameLabels,
} from "../bb/prg/budgets";

const ImageCard = styled(Card)<{
	readonly children: [JSX.Element, JSX.Element];
}>`
	padding: 0;
	overflow: hidden;

	display: flex;
	flex-direction: column;

	> :first-child {
		width: 100%;
	}

	> :last-child {
		padding: 1em;
	}
`;

function LevelSelector(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: Setter<ParsedPrg>;
	readonly setLevelIndex: (index: LevelIndex) => void;
	readonly className?: string;
}): JSX.Element {
	function getLevelIndex(eventCoord: Coord2): LevelIndex {
		const levelCoord = floor(divide(eventCoord, levelSize));
		return (levelCoord.x + levelCoord.y * 10) as LevelIndex;
	}

	function setLevels(levels: readonly Level[]) {
		props.setParsedPrg({
			...props.parsedPrg,
			levels: assertTuple(levels, 100),
		});
	}

	const [fromIndex, setFromIndex] = useState<number | undefined>(undefined);

	return (
		<ClickDragCanvas
			style={{ width: "100%" }}
			imageData={drawLevels(props.parsedPrg)}
			onClick={(eventCoord) => props.setLevelIndex(getLevelIndex(eventCoord))}
			onDragStart={(eventCoord) => setFromIndex(getLevelIndex(eventCoord))}
			onDragUpdate={(eventCoord) => {
				if (fromIndex === undefined) {
					throw new Error("No dragging in progress.");
				}

				const toIndex = getLevelIndex(eventCoord);
				if (toIndex === fromIndex) {
					return;
				}

				setLevels(reorder(props.parsedPrg.levels, fromIndex, toIndex));
				setFromIndex(toIndex);
			}}
		/>
	);
}

const clickDragCanvasEventHandlerProviders = {
	"draw-platforms": DrawPlatforms,
	"move-items": MoveItems,
	"move-enemies": MoveEnemies,
	"spawn-bubbles": SpawnBubbles,
	"wind-editor": WindEditor,
} as const satisfies Record<string, ClickDragCanvasEventHandlerProvider>;

const BudgetView = styled(
	(props: { readonly budget: Budget; className?: string }) => (
		<span className={props.className}>
			{props.budget.used}/{props.budget.max}
		</span>
	)
)`
	${(props) =>
		!budgetBlown(props.budget)
			? ""
			: css`
					background: red;
					color: white;
					border-radius: 0.1em;
			  `}
	padding: 0.2em;
`;

export function LevelPreviewCard(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: Setter<ParsedPrg>;
	readonly levelIndex: LevelIndex;
	readonly setLevelIndex: Setter<LevelIndex>;
	readonly showLevelSelectionGrid: boolean;
	readonly setShowLevelSelectionGrid: Setter<boolean>;
	readonly budgets: Budgets;
}): ReactNode {
	const setLevel = (level: Level) =>
		props.setParsedPrg({
			...props.parsedPrg,
			levels: assertTuple(
				updateArrayAtIndex(
					props.parsedPrg.levels,
					props.levelIndex,
					() => level
				),
				100
			),
		});
	const [activeTool, setActiveTool] = useState<ToolName>("draw-platforms");

	const Tool = clickDragCanvasEventHandlerProviders[activeTool];
	return (
		<Tool
			levelIndex={props.levelIndex}
			levels={props.parsedPrg.levels}
			setLevel={setLevel}
		>
			{(eventHandlers, extraTools, renderOptions) => (
				<ImageCard>
					{!props.showLevelSelectionGrid ? (
						<ClickDragCanvas
							style={{ width: "100%" }}
							imageData={imageDataFromPaletteImage(
								drawLevel(props.levelIndex, props.parsedPrg, renderOptions)
							)}
							{...eventHandlers}
						/>
					) : (
						<LevelSelector
							parsedPrg={props.parsedPrg}
							setParsedPrg={props.setParsedPrg}
							setLevelIndex={props.setLevelIndex}
						/>
					)}

					<Flex $col>
						<Flex $row $spaceBetween>
							{resourceNameLabels.map(([key, label]) => (
								<span key={key}>
									{label}: <BudgetView budget={props.budgets[key]} />
								</span>
							))}
						</Flex>
						<Flex $row $spaceBetween>
							<ButtonGroup>
								<LevelSelectionButtons
									levelIndex={props.levelIndex}
									setLevelIndex={props.setLevelIndex}
									showLevelSelectionGrid={props.showLevelSelectionGrid}
									setShowLevelSelectionGrid={props.setShowLevelSelectionGrid}
								/>
							</ButtonGroup>
							<ButtonGroup>
								<ToolButtons
									activeTool={activeTool}
									setActiveTool={setActiveTool}
									showLevelSelectionGrid={props.showLevelSelectionGrid}
								/>
							</ButtonGroup>
						</Flex>

						{extraTools}
					</Flex>
				</ImageCard>
			)}
		</Tool>
	);
}

function LevelSelectionButtons(props: {
	readonly levelIndex: LevelIndex;
	readonly setLevelIndex: Setter<LevelIndex>;
	readonly showLevelSelectionGrid: boolean;
	readonly setShowLevelSelectionGrid: Setter<boolean>;
}) {
	return (
		<>
			<button
				onClick={() =>
					props.setLevelIndex((props.levelIndex - 1) as LevelIndex)
				}
				disabled={!(!props.showLevelSelectionGrid && props.levelIndex > 0)}
			>
				{icons.chevrons.left}
			</button>
			<button
				onClick={() =>
					props.setShowLevelSelectionGrid(!props.showLevelSelectionGrid)
				}
			>
				{props.showLevelSelectionGrid ? icons.square : icons.grid}
			</button>
			<button
				onClick={() =>
					props.setLevelIndex((props.levelIndex + 1) as LevelIndex)
				}
				disabled={!(!props.showLevelSelectionGrid && props.levelIndex < 99)}
			>
				{icons.chevrons.right}
			</button>
		</>
	);
}

type ToolName = keyof typeof clickDragCanvasEventHandlerProviders;
function ToolButtons({
	activeTool,
	setActiveTool,
	showLevelSelectionGrid,
}: {
	readonly activeTool: ToolName;
	readonly setActiveTool: React.Dispatch<React.SetStateAction<ToolName>>;
	readonly showLevelSelectionGrid: boolean;
}) {
	return (
		<>
			{objectEntries({
				"draw-platforms": icons.pen,
				"move-items": icons.umbrella,
				"move-enemies": icons.buster,
				"spawn-bubbles": icons.fireBubble,
				"wind-editor": icons.wind,
			} satisfies Record<ToolName, ReactNode>).map(([toolName, icon]) => (
				<RadioButton
					key={toolName}
					$active={!showLevelSelectionGrid && activeTool === toolName}
					onClick={() => setActiveTool(toolName)}
					disabled={showLevelSelectionGrid}
				>
					{icon}
				</RadioButton>
			))}
		</>
	);
}
