import styled, { css } from "styled-components";
import {
	deleteArrayElementAtIndex,
	mapRecord,
	range,
	reorder,
	updateArrayAtIndex,
} from "../../bb/functions";
import { levelSize } from "../../bb/game-definitions/level-size";
import {
	BubbleCurrentDirection,
	BubbleCurrentPerLineDefaults,
	BubbleCurrentRectangle,
	BubbleCurrentRectangleOrSymmetry,
	rotateDirectionClockwise,
} from "../../bb/internal-data-formats/level";
import { MutableTuple } from "../../bb/tuple";
import {
	origo,
	add,
	Coord2,
	equal,
	floor,
	subtract,
	scale,
} from "../../math/coord2";
import {
	bottomRight,
	Rect,
	rectContainsPoint,
	rectIntersection,
} from "../../math/rect";
import { Setter } from "../types";
import { ButtonRow } from "../ButtonRow";
import { icons } from "../icons";
import { ReactNode, useEffect, useState } from "react";
import { CoordFields } from "../CoordFields";
import { colors } from "../global-style";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";
import { ButtonGroup } from "../ButtonGroup";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

export const WindEditorRectangles = (props: {
	readonly levelIndex: number;
	readonly rectangles: readonly BubbleCurrentRectangleOrSymmetry[];
	readonly setRectangles: Setter<readonly BubbleCurrentRectangleOrSymmetry[]>;
	readonly children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools: React.ReactNode,
		rectsList: React.ReactNode,
		levelEditorOptions: Omit<
			Extract<LevelEditorOptions, { type: "wind-editor" }>,
			"dust"
		>
	) => React.ReactNode;
}) => {
	const [selectedIndex, setSelectedIndex] = useState<number | undefined>(
		undefined
	);
	useEffect(() => {
		setSelectedIndex(undefined);
	}, [props.levelIndex]);

	type DraggedRect = {
		readonly index: number;
		readonly grabX: "left" | "center" | "right";
		readonly grabY: "top" | "center" | "bottom";
		readonly rect: Rect;
		readonly lastCoord: Coord2;
	};

	let [draggedRect, setDraggedRect] = useState<DraggedRect | undefined>(
		undefined
	);

	function updateDraggedRect(rect: Rect, lastCoord: Coord2): void {
		if (!draggedRect) {
			return;
		}

		// setDraggedRect({ ...draggedRect, rect });

		props.setRectangles(
			updateArrayAtIndex(props.rectangles, draggedRect.index, (x) => ({
				...x,
				rect,
				lastCoord,
			}))
		);
	}

	return props.children(
		{
			onDragStart: (eventCoord) => {
				const scaledEventCoord = scale(eventCoord, 1 / 8);
				const foundRect = props.rectangles
					.map((rectangle, index) => ({
						index,
						rect:
							rectangle.type !== "rectangle"
								? { pos: origo, size: origo }
								: rectangle.rect,
					}))
					.find(({ rect }) => rectContainsPoint(rect, scaledEventCoord));

				if (!foundRect) {
					setSelectedIndex(undefined);
					setDraggedRect(undefined);
					return;
				}

				const flooredCoord = floor(scaledEventCoord);
				setSelectedIndex(foundRect.index);
				setDraggedRect({
					index: foundRect.index,
					grabX:
						flooredCoord.x === foundRect.rect.pos.x
							? "left"
							: flooredCoord.x === bottomRight(foundRect.rect).x - 1
							? "right"
							: "center",
					grabY:
						flooredCoord.y === foundRect.rect.pos.y
							? "top"
							: flooredCoord.y === bottomRight(foundRect.rect).y - 1
							? "bottom"
							: "center",
					rect: foundRect.rect,
					lastCoord: scaledEventCoord,
				});
			},
			onDragEnd: () => {
				setDraggedRect(undefined);
			},
			onDragUpdate: (eventCoord) => {
				if (!draggedRect) {
					return;
				}
				const oldRectangle = props.rectangles[draggedRect.index]!;
				if (!(oldRectangle.type === "rectangle")) {
					return;
				}
				const oldRect = oldRectangle.rect;

				const scaledEventCoord = scale(eventCoord, 1 / 8);
				const sinceLast = floor(
					subtract(scaledEventCoord, draggedRect.lastCoord)
				);
				const resizedRect: Rect = {
					pos: floor(
						add(draggedRect.rect.pos, {
							x:
								draggedRect.grabX === "left" ||
								(draggedRect.grabX === "center" &&
									draggedRect.grabY === "center")
									? sinceLast.x
									: 0,
							y:
								draggedRect.grabY === "top" ||
								(draggedRect.grabY === "center" &&
									draggedRect.grabX === "center")
									? sinceLast.y
									: 0,
						})
					),
					size: floor(
						add(draggedRect.rect.size, {
							x:
								draggedRect.grabX === "right"
									? sinceLast.x
									: draggedRect.grabX === "left"
									? -sinceLast.x
									: 0,
							y:
								draggedRect.grabY === "bottom"
									? sinceLast.y
									: draggedRect.grabY === "top"
									? -sinceLast.y
									: 0,
						})
					),
				};
				const newRect: Rect = {
					pos: mapRecord(
						resizedRect.pos,
						(value, axis) => value + Math.min(resizedRect.size[axis], 0)
					),
					size: mapRecord(resizedRect.size, (value) => Math.abs(value)),
				};
				if (
					equal(newRect.pos, oldRect.pos) &&
					equal(newRect.size, oldRect.size)
				) {
					return;
				}
				updateDraggedRect(newRect, scaledEventCoord);
			},
		},
		<ButtonGroup $align="right">
			<button
				disabled={selectedIndex === undefined}
				onClick={() => {
					const selectedElement =
						selectedIndex !== undefined && props.rectangles[selectedIndex];
					const selectedRect =
						selectedElement && selectedElement.type === "rectangle"
							? selectedElement
							: undefined;
					if (!selectedRect) {
						return;
					}

					props.setRectangles(
						updateArrayAtIndex(props.rectangles, selectedIndex!, () => ({
							...selectedRect,
							direction: rotateDirectionClockwise(selectedRect.direction),
						}))
					);
				}}
			>
				{icons.rotate}
			</button>
			<button
				onClick={() =>
					props.setRectangles([...props.rectangles, { type: "symmetry" }])
				}
			>
				{icons.symmetry}
			</button>
			<button
				onClick={() => {
					const selectedElement =
						selectedIndex && props.rectangles[selectedIndex];
					const selectedRect =
						selectedElement && selectedElement.type === "rectangle"
							? selectedElement
							: undefined;
					props.setRectangles([
						...props.rectangles,
						{
							type: "rectangle",
							direction: selectedRect?.direction ?? 1,
							rect: selectedRect
								? {
										pos: add(selectedRect.rect.pos, { x: 5, y: 5 }),
										size: selectedRect.rect.size,
								  }
								: {
										pos: { x: 5, y: 5 },
										size: { x: 5, y: 5 },
								  },
						},
					]);
					setSelectedIndex(props.rectangles.length);
				}}
			>
				{icons.plus}
			</button>
			<button
				disabled={selectedIndex === undefined}
				onClick={() => {
					if (selectedIndex === undefined) {
						return;
					}
					props.setRectangles(
						deleteArrayElementAtIndex(props.rectangles, selectedIndex)
					);
					setSelectedIndex(undefined);
				}}
			>
				{icons.minus}
			</button>
		</ButtonGroup>,
		<RectsList
			rectangles={props.rectangles}
			setRectangles={props.setRectangles}
			selectedIndex={selectedIndex}
			setSelectedIndex={setSelectedIndex}
		/>,
		{
			type: "wind-editor",
			selectedRectangleIndex: selectedIndex,
		}
	);
};

const RectsListElementStyle = styled.li<{
	readonly $invalid?: boolean;
	readonly $direction?: BubbleCurrentDirection;
	readonly $active?: boolean;
}>`
	height: 2em;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.5em;

	border-radius: 0.2em;
	padding: 0.1em 0.4em;

	${({ $invalid }) =>
		!$invalid
			? ""
			: css`
					color: red;
			  `}

	${({ $direction }) =>
		$direction === undefined
			? ""
			: css`
					svg {
						transform: rotate(${$direction * 90}deg);
					}
			  `}

	${({ $active }) =>
		!$active
			? ""
			: css`
					/* background: #888; */
					svg {
						color: ${colors.active};
					}
			  `}
`;

const RectsListStyle = styled.ul`
	text-align: left;
	list-style: none;
	padding: 0;
`;

function RectsList(props: {
	readonly rectangles: readonly BubbleCurrentRectangleOrSymmetry[];
	readonly setRectangles: (
		rectangles: readonly BubbleCurrentRectangleOrSymmetry[]
	) => void;
	readonly selectedIndex: number | undefined;
	readonly setSelectedIndex: (index: number | undefined) => void;
}) {
	return (
		<DragDropContext
			onDragEnd={(result) => {
				// dropped outside the list
				if (!result.destination) {
					return;
				}

				props.setRectangles(
					reorder(
						props.rectangles,
						result.source.index,
						result.destination.index
					)
				);
			}}
		>
			<Droppable
				droppableId="RectsList"
				type="BubbleCurrentRectangleOrSymmetry"
			>
				{(provided, _snapshot) => (
					<RectsListStyle ref={provided.innerRef} {...provided.droppableProps}>
						{props.rectangles.map((rect, index) => (
							<Draggable
								key={index}
								draggableId={index.toString()}
								index={index}
							>
								{(provided, _snapshot) => (
									<RectsListElementStyle
										ref={provided.innerRef}
										{...provided.draggableProps}
										{...provided.dragHandleProps}
										$invalid={
											rect.type === "rectangle" && rectangleIsInvalid(rect)
										}
										$direction={
											rect.type !== "rectangle" ? undefined : rect.direction
										}
										$active={index === props.selectedIndex}
										onClick={() => props.setSelectedIndex(index)}
									>
										{rect.type === "symmetry" ? (
											<>
												{icons.symmetry}
												Apply Symmetry
											</>
										) : (
											<>
												{icons.arrowUp}
												<RectFields
													rect={rect.rect}
													onChange={(rect) =>
														props.setRectangles(
															updateArrayAtIndex(
																props.rectangles,
																index,
																(rectangle) => ({ ...rectangle, rect })
															)
														)
													}
												/>
											</>
										)}
									</RectsListElementStyle>
								)}
							</Draggable>
						))}
						{provided.placeholder}
					</RectsListStyle>
				)}
			</Droppable>
		</DragDropContext>
	);
}

function RectFields(props: { rect: Rect; onChange: Setter<Rect> }): ReactNode {
	return (
		<ButtonRow>
			Pos{" "}
			<CoordFields
				coord={props.rect.pos}
				onChange={(pos) => props.onChange({ ...props.rect, pos })}
			/>
			Size{" "}
			<CoordFields
				coord={props.rect.size}
				onChange={(size) => props.onChange({ ...props.rect, size })}
			/>
		</ButtonRow>
	);
}

type BubbleCurrentDirections = MutableTuple<
	MutableTuple<BubbleCurrentDirection, (typeof levelSize)["x"]>,
	(typeof levelSize)["y"]
>;

export function getBubbleCurrentDirections(
	bubbleCurrentPerLineDefaults: BubbleCurrentPerLineDefaults,
	rectangles: readonly BubbleCurrentRectangleOrSymmetry[]
): BubbleCurrentDirections {
	const reflectedDirections: Record<
		BubbleCurrentDirection,
		BubbleCurrentDirection
	> = {
		0: 0,
		1: 3,
		2: 2,
		3: 1,
	};

	const directions = range(levelSize.y).map(() =>
		range(levelSize.x).map((): BubbleCurrentDirection => 0)
	);

	for (const [y, row] of directions.entries()) {
		const perLineDefaultCurrent = bubbleCurrentPerLineDefaults[y]!;
		for (const [tileX] of row.entries()) {
			directions[y]![tileX]! = perLineDefaultCurrent;
		}
	}

	for (const rectangle of fixInvalidRectangles(rectangles)) {
		if (rectangle.type === "rectangle") {
			if (rectangleIsInvalid(rectangle)) {
				throw new Error("Bad rectangle." /* , { cause: rectangle } */);
			}

			for (
				let y = rectangle.rect.pos.y;
				y < rectangle.rect.pos.y + rectangle.rect.size.y;
				++y
			) {
				for (
					let x = rectangle.rect.pos.x;
					x < rectangle.rect.pos.x + rectangle.rect.size.x;
					++x
				) {
					directions[y]![x] = rectangle.direction;
				}
			}
		} else {
			for (let y = 0; y < levelSize.y; ++y) {
				for (let x = 0; x < levelSize.x / 2; ++x) {
					directions[y]![levelSize.x - 1 - x] =
						reflectedDirections[directions[y]![x]!]!;
				}
			}
		}
	}

	return directions as BubbleCurrentDirections;
}

export function rectangleIsInvalid(rectangle: BubbleCurrentRectangle) {
	return (
		rectangle.rect.pos.y + rectangle.rect.size.y > levelSize.y ||
		rectangle.rect.pos.x + rectangle.rect.size.x > levelSize.x
	);
}

export function fixInvalidRectangles(
	rectangles: readonly BubbleCurrentRectangleOrSymmetry[]
): BubbleCurrentRectangleOrSymmetry[] {
	const clip = (rect: Rect) =>
		rectIntersection(rect, { pos: origo, size: levelSize });

	return rectangles.flatMap((rectangle) => {
		return rectangle.type !== "rectangle" || !rectangleIsInvalid(rectangle)
			? rectangle
			: [
					rectangle.rect,
					{
						pos: add(rectangle.rect.pos, { x: -levelSize.x, y: 1 }),
						size: rectangle.rect.size,
					},
			  ]
					.map(clip)
					.filter((x) => x !== undefined)
					.map(
						(rect): BubbleCurrentRectangleOrSymmetry => ({
							...rectangle,
							rect,
						})
					);
	});
}
