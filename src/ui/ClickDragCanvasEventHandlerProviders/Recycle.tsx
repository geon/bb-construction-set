import { repeat } from "../../bb/functions";
import { levelSize } from "../../bb/game-definitions/level-size";
import { solidChar } from "../../bb/internal-data-formats/char-name";
import { Level } from "../../bb/internal-data-formats/level";
import { LevelIndex, Levels } from "../../bb/internal-data-formats/levels";
import { palette } from "../../bb/internal-data-formats/palette";
import { randomizeLevel } from "../../bb/internal-data-formats/randomize-level";
import {
	createTiles,
	getPlatformTilesAndHoles,
} from "../../bb/internal-data-formats/tiles";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { assertTuple } from "../../bb/tuple";
import { ButtonGroup } from "../ButtonGroup";
import { ButtonRow } from "../ButtonRow";
import { ClickDragCanvasDragEventHandlers } from "../ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from "../ClickDragCanvasEventHandlerProvider";
import { icons } from "../icons";
import { Setter } from "../types";

export const Recycle: ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: LevelIndex;
	levels: Levels;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools?: React.ReactNode,
		levelEditorOptions?: LevelEditorOptions
	) => React.ReactNode;
}) => {
	return props.children(
		{},
		<ButtonRow $align="right">
			<ButtonGroup>
				<button
					onClick={() =>
						props.setLevel({
							...getPlatformTilesAndHoles(createTiles()),
							bgColors: {
								dark: palette.orange,
								light: palette.yellow,
							},
							platformChar: solidChar,
							sidebarChars: undefined,
							monsters: [
								{
									characterName: "bubbleBuster",
									spawnPoint: { x: 116, y: 101 },
									facingLeft: false,
									delay: 0,
									confirmed_mystery_bits_A_3A1C: undefined,
								},
							],
							bubbleCurrentRectangles: {
								type: "rectangles",
								rectangles: [],
							},
							bubbleCurrentPerLineDefaults: assertTuple(
								repeat(0 as const, levelSize.y),
								levelSize.y
							),
							bubbleSpawns: {
								lightning: false,
								fire: false,
								water: false,
								extend: false,
							},
							itemSpawnPositions: {
								points: { x: 9, y: 7 },
								powerups: { x: 21, y: 7 },
							},
						})
					}
				>
					{icons.trash}
				</button>
				<button onClick={() => props.setLevel(randomizeLevel(props.levels))}>
					{icons.random}
				</button>
			</ButtonGroup>
		</ButtonRow>
	);
};
