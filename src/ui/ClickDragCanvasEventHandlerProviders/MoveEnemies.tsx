import { useState, useEffect } from "react";
import {
	updateArrayAtIndex,
	deleteArrayElementAtIndex,
} from "../../bb/functions";
import { CharacterName } from "../../bb/game-definitions/character-name";
import { Level, Monster } from "../../bb/internal-data-formats/level";
import { LevelEditorOptions } from "../../bb/palette-image/level";
import { spritePosOffset, spriteSizePixels } from "../../c64/consts";
import { Coord2, floor, multiply, subtract, add } from "../../math/coord2";
import { rectContainsPoint } from "../../math/rect";
import { ButtonRow } from ".././ButtonRow";
import { ClickDragCanvasDragEventHandlers } from ".././ClickDragCanvas";
import { ClickDragCanvasEventHandlerProvider } from ".././ClickDragCanvasEventHandlerProvider";
import { Flex } from ".././Flex";
import { icons } from ".././icons";
import { RadioButtonList } from ".././RadioButtonList";
import { Setter } from ".././types";
import { CoordFields } from "../CoordFields";

export const MoveEnemies: ClickDragCanvasEventHandlerProvider = (props: {
	levelIndex: number;
	level: Level;
	setLevel: Setter<Level>;
	children: (
		eventHandlers: ClickDragCanvasDragEventHandlers,
		extraTools?: React.ReactNode,
		levelEditorOptions?: LevelEditorOptions
	) => React.ReactNode;
}) => {
	const monsters = props.level.monsters;
	function setMonsters(monsters: readonly Monster[]) {
		props.setLevel({
			...props.level,
			monsters,
		});
	}
	function updateMonster(
		index: number,
		updater: (monster: Monster) => Monster
	) {
		setMonsters(updateArrayAtIndex(monsters, index, updater));
	}

	let [draggedMonster, setDraggedMonster] = useState<
		| {
				readonly index: number;
				readonly offset: Coord2;
		  }
		| undefined
	>(undefined);
	let [selectedMonster, setSelectedMonster] = useState<
		| (Monster & {
				readonly index: number;
		  })
		| undefined
	>(undefined);

	const setSelectedMonsterPosition = (spawnPoint: Coord2) => {
		if (!selectedMonster) {
			return;
		}

		const newMonster = {
			...monsters[selectedMonster.index]!,
			spawnPoint,
			index: selectedMonster.index,
		};

		setSelectedMonster(newMonster);
		updateMonster(selectedMonster.index, () => newMonster);
	};

	useEffect(() => {
		setSelectedMonster(undefined);
	}, [props.levelIndex]);

	function pixelCoordToHalfPixelCoord(coord: Coord2): Coord2 {
		return floor(
			multiply(subtract(coord, spritePosOffset), {
				x: 1 / 2,
				y: 1,
			})
		);
	}

	function findMonsterAtCoord(eventCoord: Coord2) {
		return monsters
			.map((monster, index) => ({
				...monster,
				index,
			}))
			.find(({ spawnPoint }) =>
				rectContainsPoint(
					{
						pos: pixelCoordToHalfPixelCoord(spawnPoint),
						size: spriteSizePixels,
					},
					eventCoord
				)
			);
	}

	return props.children(
		{
			onClick: (eventCoord) => {
				const monster = findMonsterAtCoord(eventCoord);
				setSelectedMonster(monster);
			},
			onDragStart: (eventCoord) => {
				const monster = findMonsterAtCoord(eventCoord);
				if (!monster) {
					return;
				}
				setDraggedMonster({
					index: monster.index,
					offset: subtract(
						eventCoord,
						pixelCoordToHalfPixelCoord(monster.spawnPoint)
					),
				});
				setSelectedMonster(monster);
			},
			onDragEnd: () => {
				setDraggedMonster(undefined);
			},
			onDragUpdate: (eventCoord) => {
				if (!draggedMonster) {
					return;
				}
				setSelectedMonsterPosition(
					add(
						multiply(subtract(eventCoord, draggedMonster.offset), {
							x: 2,
							y: 1,
						}),
						spritePosOffset
					)
				);
			},
		},
		<Flex $col>
			<ButtonRow $align="right">
				{selectedMonster && (
					<>
						<span>
							{selectedMonster.index + 1}/{monsters.length}
						</span>
						<CoordFields
							// key-prop makes state work when switching selected monster.
							key={selectedMonster.index}
							coord={selectedMonster.spawnPoint}
							onChange={(coord) => setSelectedMonsterPosition(coord)}
						/>
					</>
				)}
				<button
					disabled={selectedMonster && selectedMonster.index <= 0}
					onClick={() => {
						const index = selectedMonster
							? selectedMonster.index - 1
							: monsters.length - 1;
						setSelectedMonster({
							...monsters[index]!,
							index,
						});
					}}
				>
					{icons.chevrons.left}
				</button>
				<button
					disabled={
						selectedMonster && selectedMonster.index >= monsters.length - 1
					}
					onClick={() => {
						const index = selectedMonster ? selectedMonster.index + 1 : 0;
						setSelectedMonster({
							...monsters[index]!,
							index,
						});
					}}
				>
					{icons.chevrons.right}
				</button>
				<button
					disabled={selectedMonster === undefined}
					onClick={() =>
						selectedMonster &&
						updateMonster(selectedMonster.index, (monster) => ({
							...monster,
							facingLeft: !monster.facingLeft,
						}))
					}
				>
					{icons.symmetry}
				</button>
				<button
					disabled={monsters.length >= 6}
					onClick={() => {
						const cloneSource = selectedMonster ?? monsters[0];
						const newMonster: Monster = cloneSource
							? {
									...cloneSource,
									spawnPoint: add(cloneSource.spawnPoint, {
										x: 20,
										y: 30,
									}),
							  }
							: {
									characterName: "bubbleBuster",
									spawnPoint: { x: 100, y: 100 },
									facingLeft: false,
							  };

						setMonsters([...monsters, newMonster]);
						setSelectedMonster({ ...newMonster, index: monsters.length });
					}}
				>
					{icons.plus}
				</button>
				<button
					disabled={selectedMonster === undefined}
					onClick={() => {
						if (!selectedMonster) {
							return;
						}
						setMonsters(
							deleteArrayElementAtIndex(monsters, selectedMonster.index)
						);
						setSelectedMonster(undefined);
					}}
				>
					{icons.minus}
				</button>
			</ButtonRow>
			{selectedMonster && (
				<ButtonRow $align="right">
					<RadioButtonList
						options={
							{
								bubbleBuster: "Bubble Buster",
								incendo: "Incendo",
								colley: "Colley",
								hullaballoon: "Hullaballoon",
								beluga: "Beluga",
								willyWhistle: "Willy Whistle",
								stoner: "Stoner",
								superSocket: "Super Socket",
							} satisfies Record<Exclude<CharacterName, "player">, string>
						}
						selected={
							props.level.monsters[selectedMonster.index]?.characterName
						}
						setSelected={(characterName) =>
							props.setLevel({
								...props.level,
								monsters: updateArrayAtIndex(
									monsters,
									selectedMonster.index,
									(monster) => ({ ...monster, characterName })
								),
							})
						}
					/>
				</ButtonRow>
			)}
		</Flex>,
		{
			type: "move-enemies",
			selectedMonsterIndex: selectedMonster?.index,
			dragging: !!draggedMonster,
		}
	);
};
