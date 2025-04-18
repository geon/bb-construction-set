import { TabBar } from "./TabBar";
import styled from "styled-components";
import { Card } from "./Card";
import { PrgSelector } from "./PrgSelector";
import { useState } from "react";
import { Levels } from "./tabs/Levels";
import { Sprites } from "./tabs/Sprites";
import { PrgDownloader } from "./PrgDownloader";
import { Items } from "./tabs/Items";
import { LevelGraphics } from "./tabs/LevelGraphics";
import { ParsedPrg, parsePrg } from "../bb/prg/parse-prg";
import { attempt } from "../bb/functions";

const Page = styled.div`
	width: 600px;
	margin: 0 auto;
	padding: 1rem;
	text-align: center;

	display: flex;
	flex-direction: column;
	gap: 2em;
`;

export function App() {
	const [state, setState] = useState<
		| {
				readonly prg: ArrayBuffer;
				readonly parsedPrg: ParsedPrg;
		  }
		| undefined
	>();

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

	return (
		<Page>
			<h1>BB Construction Set</h1>
			<Card>
				{prg ? (
					<PrgDownloader prg={prg} parsedPrg={parsedPrg} />
				) : (
					<PrgSelector setPrg={setPrg} />
				)}
			</Card>
			{parsedPrg && (
				<TabBar
					initialTabId={"patchLevels"}
					tabs={{
						patchLevels: {
							title: "Levels",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Levels
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
											/>
										</Card>
									</>
								);
							},
						},
						patchLevelGraphics: {
							title: "Level Graphics",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<LevelGraphics
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
											/>
										</Card>
									</>
								);
							},
						},
						patchSprites: {
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
						patchItems: {
							title: "Items",
							render: (tab) => {
								return (
									<>
										<Card>
											<h2>{tab.title}</h2>
											<Items
												parsedPrg={parsedPrg}
												setParsedPrg={setParsedPrg}
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
