import { TabBar } from "./TabBar";
import styled from "styled-components";
import { Card } from "./Card";
import { useState } from "react";
// import { Levels } from "./tabs/Levels";
import { Sprites } from "./tabs/Sprites";
import { FileMenu } from "./FileMenu";
import { Chars } from "./tabs/Chars";
import { parsePrg } from "../bb/prg/parse-prg";
import { ParsedPrg } from "../bb/internal-data-formats/parsed-prg";
import { attempt } from "../bb/functions";
import { Items } from "./tabs/Items";
import { Custom } from "./tabs/Custom";
import { Patch } from "../bb/prg/io";
import { EnemyBonuses } from "./tabs/EnemyBonuses";
import { Levels } from "./tabs/Levels";
import { LevelPreviewCard } from "./LevelPreviewCard";
import { originalPrg as originalPrg } from "../bb/prg/parsed-prg";
import { LevelIndex } from "../bb/internal-data-formats/levels";
import { getBudgets } from "../bb/prg/budgets";

const Page = styled.div`
	width: 100%;
	box-sizing: border-box;
	max-width: 960px;

	margin: 0 auto;
	padding: 1rem;
	text-align: center;

	display: flex;
	flex-direction: column;
	gap: 2em;
`;

export function App() {
	const [state, setState] = useState<{
		readonly prg: ArrayBuffer;
		readonly parsedPrg: ParsedPrg;
	}>(() => {
		const prg = new Uint8Array(originalPrg).buffer;
		return { prg, parsedPrg: parsePrg(prg) };
	});

	const setPrg = (prg: ArrayBuffer): void => {
		const parsedPrg = attempt(() => parsePrg(prg));
		if (parsedPrg.type !== "ok") {
			alert(`Could not parse prg: ${parsedPrg.error ?? "No reason."}`);
			return;
		}

		setState({ prg, parsedPrg: parsedPrg.result });
	};

	const setParsedPrg = (parsedPrg: ParsedPrg): void => {
		if (!state) {
			throw new Error("State should be set first.");
		}
		setState({ prg: state?.prg, parsedPrg });
	};

	const { parsedPrg, prg } = state ?? { parsedPrg: undefined, prg: undefined };

	const [levelIndex, _setLevelIndex] = useState<LevelIndex>(0);
	const [showLevelSelectionGrid, setShowLevelSelectionGrid] =
		useState<boolean>(false);
	const setLevelIndex = (index: LevelIndex) => {
		_setLevelIndex(index);
		setShowLevelSelectionGrid(false);
	};

	const [manualPatch, setManualPatch] = useState<Patch>([]);

	const budgets = getBudgets(parsedPrg.levels);

	return (
		<Page>
			<h1>BB Construction Set</h1>
			<FileMenu
				prg={prg}
				setPrg={setPrg}
				parsedPrg={parsedPrg}
				manualPatch={manualPatch}
				budgets={budgets}
			/>
			<LevelPreviewCard
				parsedPrg={parsedPrg}
				setParsedPrg={setParsedPrg}
				levelIndex={levelIndex}
				setLevelIndex={setLevelIndex}
				showLevelSelectionGrid={showLevelSelectionGrid}
				setShowLevelSelectionGrid={setShowLevelSelectionGrid}
				budgets={budgets}
			/>
			{levelIndex !== undefined && (
				<TabBar
					initialTabId={"levels"}
					tabs={{
						levels: {
							title: "Levels",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Levels
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
												levelIndex={levelIndex}
												setLevelIndex={setLevelIndex}
											/>
										</Card>
									</>
								);
							},
						},
						sprites: {
							title: "Sprites",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Sprites
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
											/>
										</Card>
									</>
								);
							},
						},
						chars: {
							title: "Chars",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Chars
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
											/>
										</Card>
									</>
								);
							},
						},
						items: {
							title: "Items",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Items
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
												levelIndex={levelIndex}
											/>
										</Card>
									</>
								);
							},
						},
						enemyBonuses: {
							title: "Enemy Bonuses",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<EnemyBonuses
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
											/>
										</Card>
									</>
								);
							},
						},
						custom: {
							title: "Custom",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Custom
												manualPatch={manualPatch}
												setManualPatch={setManualPatch}
												purge={() => {
													setManualPatch([]);
													const prg = new Uint8Array(originalPrg).buffer;
													setState({ prg, parsedPrg });
												}}
											/>
										</Card>
									</>
								);
							},
						},
					}}
				/>
			)}
		</Page>
	);
}
