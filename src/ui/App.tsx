import { TabBar } from "./TabBar";
import styled from "styled-components";
import { Card } from "./Card";
import { PrgSelector } from "./PrgSelector";
import { useState } from "react";
import { LevelsVisualizerWithPeDownload } from "./tabs/LevelsVisualizerWithPeDownload";
import { SpritesVisualizerWithBinDownload } from "./tabs/SpritesVisualizerWithBinDownload";
import { PrgDownloader } from "./PrgDownloader";
import { Items } from "./tabs/Items";
import { LevelGraphicsVisualizerWithPeDownload } from "./tabs/LevelGraphicsVisualizerWithPeDownload";

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
	// TODO: Store the internal format, as well as the original prg, and patch on save.
	const [prg, setPrg] = useState<ArrayBuffer | undefined>();

	return (
		<Page>
			<h1>BB Construction Set</h1>
			<Card>
				{prg ? <PrgDownloader prg={prg} /> : <PrgSelector setPrg={setPrg} />}
			</Card>
			{prg && (
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
											<LevelsVisualizerWithPeDownload
												prg={prg}
												setPrg={setPrg}
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
											<LevelGraphicsVisualizerWithPeDownload
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
											<SpritesVisualizerWithBinDownload
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
											<Items prg={prg} />
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
