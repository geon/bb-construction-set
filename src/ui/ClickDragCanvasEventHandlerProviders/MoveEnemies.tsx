import { useState, useEffect } from "react";
import {
	updateArrayAtIndex,
	deleteArrayElementAtIndex,
} from "../../bb/functions";
import { CharacterName } from "../../bb/game-definitions/character-name";
import { Monster } from "../../bb/internal-data-formats/level";
import { spritePosOffset, spriteSizePixels } from "../../c64/consts";
import { Coord2, floor, subtract, add } from "../../math/coord2";
import { rectContainsPoint } from "../../math/rect";
import { ButtonRow } from ".././ButtonRow";
import { ClickDragCanvasEventHandlerProvider } from ".././ClickDragCanvasEventHandlerProvider";
import { Flex } from ".././Flex";
import { icons } from ".././icons";
import { RadioButtonList } from ".././RadioButtonList";
import { CoordFields } from "../CoordFields";
import { ButtonGroup } from "../ButtonGroup";
import { IntegerInput } from "../IntegerInput";
import { clamp } from "../../math/scalar";
import { truncateMonsterPosition } from "../../bb/prg/monsters";

export const MoveEnemies: ClickDragCanvasEventHandlerProvider = (props) => {
	const level = props.levels[props.levelIndex];
	const monsters = level.monsters;
	function setMonsters(monsters: readonly Monster[]) {
		props.setLevel({
			...level,
			monsters,
		});
	}

	let [draggedMonster, setDraggedMonster] = useState<
		| {
				readonly index: number;
				readonly offset: Coord2;
		  }
		| undefined
	>(undefined);

	let [selectedMonsterIndex, setSelectedMonsterIndex] = useState<
		number | undefined
	>(undefined);

	const selectedMonster =
		selectedMonsterIndex === undefined
			? undefined
			: monsters[selectedMonsterIndex];

	function updateSelectedMonster(updater: (monster: Monster) => Monster) {
		if (selectedMonsterIndex === undefined) {
			return;
		}
		setMonsters(updateArrayAtIndex(monsters, selectedMonsterIndex, updater));
	}

	const setSelectedMonsterPosition = (spawnPoint: Coord2) => {
		if (!selectedMonster) {
			return;
		}

		const newMonster = {
			...selectedMonster,
			spawnPoint: truncateMonsterPosition(spawnPoint),
		};

		updateSelectedMonster(() => newMonster);
	};

	useEffect(() => {
		setSelectedMonsterIndex(undefined);
	}, [props.levelIndex]);

	function pixelCoordToHalfPixelCoord(coord: Coord2): Coord2 {
		return floor(subtract(coord, spritePosOffset));
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
						size: {
							x: spriteSizePixels.x * 2,
							y: spriteSizePixels.y,
						},
					},
					eventCoord,
				),
			);
	}

	return props.children(
		{
			onClick: (eventCoord) => {
				const monster = findMonsterAtCoord(eventCoord);
				setSelectedMonsterIndex(monster?.index);
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
						pixelCoordToHalfPixelCoord(monster.spawnPoint),
					),
				});
				setSelectedMonsterIndex(monster.index);
			},
			onDragEnd: () => {
				setDraggedMonster(undefined);
			},
			onDragUpdate: (eventCoord) => {
				if (!draggedMonster) {
					return;
				}
				setSelectedMonsterPosition(
					add(subtract(eventCoord, draggedMonster.offset), spritePosOffset),
				);
			},
		},
		<Flex $col>
			<ButtonRow $align="right">
				{!(
					selectedMonster && selectedMonsterIndex !== undefined
				) ? undefined : (
					<>
						<button
							onClick={() =>
								setMonsters(
									monsters.map((monster) => ({ ...monster, delay: 20 })),
								)
							}
						>
							20f
						</button>
						<span>
							{selectedMonsterIndex + 1}/{monsters.length}
						</span>
						<label>
							Delay:{" "}
							<IntegerInput
								value={selectedMonster.delay}
								onChange={(newValue) =>
									updateSelectedMonster((monster) => ({
										...monster,
										delay: clamp(newValue, 0, 0b00111111),
									}))
								}
							/>
						</label>
						<CoordFields
							// key-prop makes state work when switching selected monster.
							key={selectedMonsterIndex}
							coord={selectedMonster.spawnPoint}
							onChange={(coord) => setSelectedMonsterPosition(coord)}
						/>
					</>
				)}
				<ButtonGroup $align="right">
					<button
						disabled={
							!monsters.length ||
							(selectedMonsterIndex !== undefined && selectedMonsterIndex <= 0)
						}
						onClick={() => {
							const index =
								selectedMonsterIndex !== undefined
									? selectedMonsterIndex - 1
									: monsters.length - 1;
							setSelectedMonsterIndex(index);
						}}
					>
						{icons.chevrons.left}
					</button>
					<button
						disabled={
							!monsters.length ||
							(selectedMonsterIndex !== undefined &&
								selectedMonsterIndex >= monsters.length - 1)
						}
						onClick={() => {
							const index =
								selectedMonsterIndex !== undefined
									? selectedMonsterIndex + 1
									: 0;
							setSelectedMonsterIndex(index);
						}}
					>
						{icons.chevrons.right}
					</button>
					<button
						disabled={selectedMonster === undefined}
						onClick={() =>
							selectedMonster &&
							updateSelectedMonster((monster) => ({
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
										delay: 0,
										confirmed_mystery_bits_A_3A1C: undefined,
									};

							setMonsters([...monsters, newMonster]);
							setSelectedMonsterIndex(monsters.length);
						}}
					>
						{icons.plus}
					</button>
					<button
						disabled={selectedMonster === undefined}
						onClick={() => {
							if (selectedMonsterIndex === undefined) {
								return;
							}
							setMonsters(
								deleteArrayElementAtIndex(monsters, selectedMonsterIndex),
							);
							setSelectedMonsterIndex(undefined);
						}}
					>
						{icons.minus}
					</button>
				</ButtonGroup>
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
						selected={selectedMonster?.characterName}
						setSelected={(characterName) =>
							updateSelectedMonster((monster) => ({
								...monster,
								characterName,
								// The mystery bits are not identical for all monsters.
								confirmed_mystery_bits_A_3A1C: undefined,
							}))
						}
					/>
				</ButtonRow>
			)}
		</Flex>,
		{
			type: "move-enemies",
			selectedMonsterIndex,
			dragging: !!draggedMonster,
		},
	);
};
