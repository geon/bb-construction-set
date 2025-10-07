import { ReactNode } from "react";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import { imageDataFromPaletteImage } from "../bb/image-data/image-data";
import { drawLevel } from "../bb/palette-image/level";
import { doubleImageWidth } from "../bb/palette-image/palette-image";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { assertTuple } from "../bb/tuple";
import { Card } from "./Card";
import styled from "styled-components";
import { drawLevelThumbnail } from "../bb/image-data/draw-level";
import { mapRecord } from "../bb/functions";
import { ButtonRow } from "./ButtonRow";
import { icons } from "./icons";
import { Setter } from "./types";

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

const LevelPreview = styled.div`
	display: flex;
	flex-direction: column;
`;

export function LevelPreviewCard(props: {
	readonly parsedPrg: ParsedPrg;
	readonly levelIndex: number;
	readonly setLevelIndex: Setter<number>;
	readonly showLevelSelectionGrid: boolean;
	readonly setShowLevelSelectionGrid: Setter<boolean>;
}): ReactNode {
	return (
		<ImageCard>
			<LevelPreview>
				{!props.showLevelSelectionGrid ? (
					<ImageDataCanvas
						style={{ width: "100%" }}
						imageData={imageDataFromPaletteImage(
							doubleImageWidth(drawLevel(props.levelIndex, props.parsedPrg))
						)}
					/>
				) : (
					<LevelSelector
						parsedPrg={props.parsedPrg}
						setLevelIndex={props.setLevelIndex}
					/>
				)}
			</LevelPreview>
			<div>
				<LevelSelectionButtons
					levelIndex={props.levelIndex}
					setLevelIndex={props.setLevelIndex}
					showLevelSelectionGrid={props.showLevelSelectionGrid}
					setShowLevelSelectionGrid={props.setShowLevelSelectionGrid}
				/>
			</div>
		</ImageCard>
	);
}

function LevelSelectionButtons(props: {
	readonly levelIndex: number;
	readonly setLevelIndex: Setter<number>;
	readonly showLevelSelectionGrid: boolean;
	readonly setShowLevelSelectionGrid: Setter<boolean>;
}) {
	return (
		<ButtonRow>
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
		</ButtonRow>
	);
}
