import React, { useState } from "react";
import { mapRecord, range, updateArrayAtIndex } from "../../bb/functions";
import { Level } from "../../bb/internal-data-formats/level";
import { LevelIndex, Levels } from "../../bb/internal-data-formats/levels";
import {
	palette,
	PaletteIndex,
	SubPalette,
	SubPaletteIndex,
} from "../../bb/internal-data-formats/palette";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { ButtonRow } from "../ButtonRow";
import {
	ClickDragCanvas,
	ClickDragCanvasDragEventHandlers,
} from "../ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { Flex } from "../Flex";
import { Palette } from "../Palette";
import { Setter } from "../types";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { icons } from "../icons";
import { CharBlock } from "../../bb/internal-data-formats/char-block";
import { drawCharBlock, getCharPalette } from "../../bb/palette-image/char";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";
import { Coord2, divide, floor } from "../../math/coord2";
import { assertTuple, mapTuple } from "../../bb/tuple";
import { useDraw } from "./use-draw";
import { ButtonGroup } from "../ButtonGroup";
import { RadioButton } from "../RadioButton";

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
		<Flex $col>
			{(
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
			))}
			<PlatformGraphicsEditor level={level} setLevel={props.setLevel} />
		</Flex>
	);
};

const editorSize = "256px";

function PlatformGraphicsEditor(props: {
	readonly level: Level;
	readonly setLevel: Setter<Level>;
}) {
	const platformPalette = getCharPalette(palette.green, props.level.bgColors);
	const [selectedSubPaletteIndex, setSelectedSubPaletteIndex] =
		useState<SubPaletteIndex>(0);

	return (
		<Flex $row $center>
			<Flex $col $center>
				<ButtonGroup style={{ justifyContent: "flex-end" }}>
					<RadioButton
						$active={!!props.level.sidebarChars}
						onClick={() =>
							props.setLevel({
								...props.level,
								sidebarChars: [
									[props.level.platformChar, props.level.platformChar],
									[props.level.platformChar, props.level.platformChar],
								],
							})
						}
					>
						{icons.square}
					</RadioButton>
					<RadioButton
						$active={!props.level.sidebarChars}
						onClick={() =>
							confirm("Delete sidebar decor?") &&
							props.setLevel({
								...props.level,
								sidebarChars: undefined,
							})
						}
					>
						{icons.grid2x2}
					</RadioButton>
				</ButtonGroup>

				<Palette
					selectedOptionIndex={selectedSubPaletteIndex}
					options={mapTuple(platformPalette, (x) => x ?? palette.black)}
					onPick={(optionIndex) =>
						setSelectedSubPaletteIndex(optionIndex as SubPaletteIndex)
					}
				/>
			</Flex>
			{props.level.sidebarChars ? (
				<CharBlockEditor
					charBlock={props.level.sidebarChars}
					setCharBlock={(sidebarChars) =>
						props.setLevel({ ...props.level, sidebarChars })
					}
					palette={platformPalette}
					drawValue={selectedSubPaletteIndex}
				/>
			) : (
				<div
					style={{
						backgroundColor: "#1a1a1a",
						width: editorSize,
						height: editorSize,
					}}
				/>
			)}
			<CharBlockEditor
				charBlock={[[props.level.platformChar]]}
				setCharBlock={(charBlock) =>
					props.setLevel({ ...props.level, platformChar: charBlock[0]![0]! })
				}
				palette={platformPalette}
				drawValue={selectedSubPaletteIndex}
			/>
		</Flex>
	);
}

function CharBlockEditor(props: {
	readonly charBlock: CharBlock;
	readonly setCharBlock: Setter<CharBlock>;
	readonly palette: SubPalette;
	readonly drawValue: SubPaletteIndex;
}): React.ReactNode {
	return (
		<ClickDragCanvas
			style={{ width: editorSize }}
			imageData={imageDataFromPaletteImage(
				doubleImageWidth(drawCharBlock(props.charBlock, props.palette))
			)}
			{...useDraw(
				() => 0 as const,
				(coords) =>
					props.setCharBlock(
						coords.reduce(
							(soFar, current) =>
								updatePixelInCharBlock(soFar, current, props.drawValue),
							props.charBlock
						)
					),
				(coord) => floor(divide(coord, { x: 2, y: 1 }))
			)}
		/>
	);
}

function updatePixelInCharBlock(
	charBlock: CharBlock,
	eventCoord: Coord2,
	subPaletteIndex: SubPaletteIndex
): CharBlock {
	const tileCoord = floor(divide(eventCoord, { x: 4, y: 8 }));
	const pixelCoord = floor(
		mapRecord(eventCoord, (value, axis) => value % { x: 4, y: 8 }[axis])
	);
	return updateArrayAtIndex(charBlock, tileCoord.x, (column) =>
		updateArrayAtIndex(column, tileCoord.y, (char) =>
			assertTuple(
				updateArrayAtIndex(char, pixelCoord.y, (row) =>
					assertTuple(
						updateArrayAtIndex(row, pixelCoord.x, () => subPaletteIndex),
						4
					)
				),
				8
			)
		)
	);
}
