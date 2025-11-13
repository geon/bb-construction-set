import {
	BubbleCurrentDirection,
	BubbleCurrentPerLineDefaults,
	BubbleCurrentRectangleOrSymmetry,
	Level,
} from "../../bb/internal-data-formats/level";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { WindEditorCopy } from "./WindEditorCopy";
import {
	WindEditorRectangles,
	fixInvalidRectangles,
	rectangleIsInvalid,
} from "./WindEditorRectangles";
import { Flex } from "../Flex";
import { ButtonRow } from "../ButtonRow";
import { icons } from "../icons";
import { ButtonGroup } from "../ButtonGroup";
import { RadioButton } from "../RadioButton";
import { useEffect, useMemo, useState } from "react";
import { add, Coord2, origo, scale } from "../../math/coord2";
import { checkedAccess, range } from "../../bb/functions";
import { levelSize } from "../../bb/game-definitions/level-size";
import { MutableTuple } from "../../bb/tuple";
import { LevelIndex, Levels } from "../../bb/internal-data-formats/levels";
import { rectContainsPoint } from "../../math/rect";
import { Setter } from "../types";
import { WindEditorPerLineDefaults } from "./WindEditorPerLineDefaults";

const directionVectors: Record<BubbleCurrentDirection, Coord2> = {
	[0]: { x: 0, y: -1 },
	[1]: { x: 1, y: 0 },
	[2]: { x: 0, y: 1 },
	[3]: { x: -1, y: 0 },
};

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
		rectangles: readonly BubbleCurrentRectangleOrSymmetry[]
	): void {
		props.setLevel({
			...level,
			bubbleCurrentRectangles: {
				type: "rectangles",
				rectangles,
			},
		});
	}

	function getRectangles(
		levels: Levels,
		level: Level
	): readonly BubbleCurrentRectangleOrSymmetry[] {
		let bubbleCurrentRectangles = level.bubbleCurrentRectangles;

		for (const _ of range(100)) {
			if (bubbleCurrentRectangles.type === "rectangles") {
				return bubbleCurrentRectangles.rectangles;
			}

			const otherLevel = levels[bubbleCurrentRectangles.levelIndex];
			if (!otherLevel) {
				throw new Error("Level index out of bounds.");
			}

			bubbleCurrentRectangles = otherLevel.bubbleCurrentRectangles;
		}

		// TODO: Show this error to the user.
		// throw new Error("Source rectangles not found.");

		return [];
	}

	const rectangles = useMemo(() => getRectangles(props.levels, level), [level]);

	const directions = getBubbleCurrentDirections(
		level.bubbleCurrentPerLineDefaults,
		rectangles
	);

	const [frame, setFrame] = useState<number>(0);
	useEffect(() => {
		const getFrame = createGetFrame();

		const timerId = setInterval(() => {
			setFrame(getFrame.next().value);
		}, 1000 / 20);

		function stop() {
			clearInterval(timerId);
		}

		return stop;
	}, []);

	const dust = directions.flatMap((row, y) =>
		row
			.map((direction, x) =>
				add(
					add(scale({ x, y }, 8), { x: 4, y: 4 }),
					scale(directionVectors[direction], frame)
				)
			)
			.filter((mote) =>
				rectContainsPoint({ pos: origo, size: scale(levelSize, 8) }, mote)
			)
	);

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
					{ type: "wind-editor", dust }
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
					{ type: "wind-editor", dust }
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
					{ ...levelEditorOptions, dust }
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
							{icons.copy}
						</RadioButton>
					</ButtonGroup>
				)}
				{props.extraTools}
			</ButtonRow>
			{props.rectsList}
		</Flex>
	);
}

function* createGetFrame(): Generator<number, never, void> {
	let frame = 0;
	for (;;) {
		yield frame;
		++frame;
		if (frame >= 8) {
			frame = 0;
		}
	}
}

type BubbleCurrentDirections = MutableTuple<
	MutableTuple<BubbleCurrentDirection, (typeof levelSize)["x"]>,
	(typeof levelSize)["y"]
>;

function getBubbleCurrentDirections(
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
