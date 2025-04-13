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
	// TODO: Patch on save.
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

	const { parsedPrg, prg } = state ?? { parsedPrg: undefined, prg: undefined };

	return (
		<Page>
			<h1>BB Construction Set</h1>
			<Card>
				{prg ? <PrgDownloader prg={prg} /> : <PrgSelector setPrg={setPrg} />}
			</Card>
			{prg && parsedPrg && (
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
											<Levels parsedPrg={parsedPrg} prg={prg} setPrg={setPrg} />
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
												prg={prg}
												setPrg={setPrg}
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
												prg={prg}
												setPrg={setPrg}
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
											<Items parsedPrg={parsedPrg} prg={prg} />
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
