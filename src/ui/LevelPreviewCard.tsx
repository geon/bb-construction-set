import { ReactNode, useState } from "react";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import { imageDataFromPaletteImage } from "../bb/image-data/image-data";
import { drawLevel } from "../bb/palette-image/level";
import { doubleImageWidth } from "../bb/palette-image/palette-image";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { assertTuple } from "../bb/tuple";
import { Card } from "./Card";
import styled, { css } from "styled-components";
import { drawLevelThumbnail } from "../bb/image-data/draw-level";
import { mapRecord, objectEntries, updateArrayAtIndex } from "../bb/functions";
import { ButtonRow } from "./ButtonRow";
import { icons } from "./icons";
import { Setter } from "./types";
import { ClickDragCanvas } from "./ClickDragCanvas";
import { Level } from "../bb/internal-data-formats/level";
import { colors } from "./global-style";
import { Flex } from "./Flex";
import { DrawPlatforms } from "./ClickDragCanvasEventHandlerProviders/DrawPlatforms";
import { MoveEnemies } from "./ClickDragCanvasEventHandlerProviders/MoveEnemies";
import { MoveItems } from "./ClickDragCanvasEventHandlerProviders/MoveItems";
import { SpawnBubbles } from "./ClickDragCanvasEventHandlerProviders/SpawnBubbles";
import { ClickDragCanvasEventHandlerProvider } from "./ClickDragCanvasEventHandlerProvider";

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

const LevelSelector = styled(
	(props: {
		readonly parsedPrg: ParsedPrg;
		readonly setLevelIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		const shadowChars = assertTuple(
			props.parsedPrg.chars.shadows.flat().flat(),
			6
		);
		const spriteColors = mapRecord(
			props.parsedPrg.sprites,
			({ color }) => color
		);

		return (
			<nav className={props.className}>
				{props.parsedPrg.levels.map((level, levelIndex) => (
					<ImageDataCanvas
						key={levelIndex}
						imageData={drawLevelThumbnail(level, spriteColors, shadowChars)}
						onClick={() => props.setLevelIndex(levelIndex)}
						style={{ cursor: "pointer" }}
					/>
				))}
			</nav>
		);
	}
)`
	display: grid;
	grid-template-rows: 1fr min-content;
	grid-template-columns: repeat(10, auto);

	canvas {
		width: 100%;
	}
`;

const clickDragCanvasEventHandlerProviders = {
	"draw-platforms": DrawPlatforms,
	"move-items": MoveItems,
	"move-enemies": MoveEnemies,
	"spawn-bubbles": SpawnBubbles,
} as const satisfies Record<string, ClickDragCanvasEventHandlerProvider>;

export function LevelPreviewCard(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: Setter<ParsedPrg>;
	readonly levelIndex: number;
	readonly setLevelIndex: Setter<number>;
	readonly showLevelSelectionGrid: boolean;
	readonly setShowLevelSelectionGrid: Setter<boolean>;
}): ReactNode {
	const level = props.parsedPrg.levels[props.levelIndex]!;
	const setLevel = (level: Level) =>
		props.setParsedPrg({
			...props.parsedPrg,
			levels: updateArrayAtIndex(
				props.parsedPrg.levels,
				props.levelIndex,
				() => level
			),
		});
	const [activeTool, setActiveTool] = useState<ToolName>("draw-platforms");

	const Tool = clickDragCanvasEventHandlerProviders[activeTool];
	return (
		<Tool levelIndex={props.levelIndex} level={level} setLevel={setLevel}>
			{(eventHandlers, extraTools, renderOptions) => (
				<ImageCard>
					{!props.showLevelSelectionGrid ? (
						<ClickDragCanvas
							style={{ width: "100%" }}
							imageData={imageDataFromPaletteImage(
								doubleImageWidth(
									drawLevel(props.levelIndex, props.parsedPrg, renderOptions)
								)
							)}
							{...eventHandlers}
						/>
					) : (
						<LevelSelector
							parsedPrg={props.parsedPrg}
							setLevelIndex={props.setLevelIndex}
						/>
					)}

					<Flex $col>
						<ButtonRow>
							<ButtonRow>
								<LevelSelectionButtons
									levelIndex={props.levelIndex}
									setLevelIndex={props.setLevelIndex}
									showLevelSelectionGrid={props.showLevelSelectionGrid}
									setShowLevelSelectionGrid={props.setShowLevelSelectionGrid}
								/>
							</ButtonRow>
							<ButtonRow>
								<ToolButtons
									activeTool={activeTool}
									setActiveTool={setActiveTool}
									showLevelSelectionGrid={props.showLevelSelectionGrid}
								/>
							</ButtonRow>
						</ButtonRow>

						{extraTools}
					</Flex>
				</ImageCard>
			)}
		</Tool>
	);
}

function LevelSelectionButtons(props: {
	readonly levelIndex: number;
	readonly setLevelIndex: Setter<number>;
	readonly showLevelSelectionGrid: boolean;
	readonly setShowLevelSelectionGrid: Setter<boolean>;
}) {
	return (
		<>
			<button
				onClick={() => props.setLevelIndex(props.levelIndex - 1)}
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
				onClick={() => props.setLevelIndex(props.levelIndex + 1)}
				disabled={!(!props.showLevelSelectionGrid && props.levelIndex < 99)}
			>
				{icons.chevrons.right}
			</button>
		</>
	);
}

const RadioButton = styled.button<{ readonly $active?: boolean }>`
	${({ $active }) =>
		!$active
			? ""
			: css`
					border-color: ${colors.active};
					&:focus {
						outline-color: ${colors.active};
					}
			  `}
`;

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
