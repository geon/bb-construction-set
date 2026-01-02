import { ReactNode, useState } from "react";
import { Flex } from "../Flex";
import { CheckboxList } from "../CheckboxList";
import { ButtonRow } from "../ButtonRow";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { mapRecord } from "../../bb/functions";
import { Level } from "../../bb/internal-data-formats/level";
import { parsePrg } from "../../bb/prg/parse-prg";
import { originalPrg } from "../../bb/prg/parsed-prg";
import { Setter } from "../types";
import { Levels } from "../../bb/internal-data-formats/levels";
import { Patch } from "../../bb/prg/io";

type DataCategory = Exclude<keyof ParsedPrg, "levels"> | "custom" | keyof Level;

const dataCategoryLabels: Record<DataCategory, string> = {
	custom: "Custom",
	sprites: "Sprites",
	chars: "Chars",
	items: "Items",
	enemyDeathBonusIndices: "Enemy Death Bonus Indices",
	platformTiles: "platformTiles",
	holes: "holes",
	bgColors: "bgColors",
	platformChar: "platformChar",
	sidebarChars: "sidebarChars",
	monsters: "monsters",
	bubbleCurrentRectangles: "bubbleCurrentRectangles",
	bubbleCurrentPerLineDefaults: "bubbleCurrentPerLineDefaults",
	bubbleSpawns: "bubbleSpawns",
	itemSpawnPositions: "itemSpawnPositions",
};

type DataCategorySelection = Record<DataCategory, boolean>;

type State = {
	readonly prg: ArrayBuffer;
	readonly parsedPrg: ParsedPrg;
};

export function Purge(props: {
	readonly setManualPatch: (manualPatch: Patch) => void;
	readonly setState: Setter<State>;
	readonly state: State;
}): ReactNode {
	const [selectedDataCategories, setSelectedDataCategories] =
		useState<DataCategorySelection>(
			mapRecord(dataCategoryLabels, (_) => false)
		);

	return (
		<Flex $col>
			<Flex $col style={{ textAlign: "left" }}>
				<CheckboxList
					options={dataCategoryLabels}
					selected={selectedDataCategories}
					setSelected={setSelectedDataCategories}
					disabled={{}}
				/>
			</Flex>
			<ButtonRow>
				<button
					onClick={() => {
						if (selectedDataCategories.custom) {
							props.setManualPatch([]);
						}
						const prg = new Uint8Array(originalPrg).buffer;
						props.setState({
							prg: selectedDataCategories.custom ? prg : props.state.prg,
							parsedPrg: mapRecord(
								parsePrg(prg),
								(purgedProperty, propertyName) => {
									if (propertyName === "levels") {
										return (purgedProperty as Levels).map((level, levelIndex) =>
											mapRecord(
												level,
												(purgedLevelProperty, levelPropertyName) =>
													selectedDataCategories[levelPropertyName]
														? purgedLevelProperty
														: props.state.parsedPrg.levels[levelIndex]![
																levelPropertyName
														  ]
											)
										);
									}

									return selectedDataCategories[propertyName]
										? purgedProperty
										: props.state.parsedPrg[propertyName];
								}
							) as ParsedPrg,
						});
					}}
				>
					Purge
				</button>
			</ButtonRow>
		</Flex>
	);
}
