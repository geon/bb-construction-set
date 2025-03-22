import { TabBar } from "./TabBar";
import styled from "styled-components";
import { Card } from "./Card";
import { MinimalPrgSelector } from "./MinimalPrgSelector";
import { useState } from "react";
import { LevelsVisualizerWithPeDownload } from "./LevelsVisualizerWithPeDownload";
import { LevelsPatcher } from "./LevelsPatcher";
import { SpritesPatcher } from "./SpritesPatcher";
import { SpritesVisualizerWithBinDownload } from "./SpritesVisualizerWithBinDownload";
import { PrgDownloader } from "./PrgDownloader";

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
	const [prg, setPrg] = useState<ArrayBuffer | undefined>();

	return (
		<Page>
			<h1>BB Construction Set</h1>
			<Card>
				{prg ? (
					<PrgDownloader prg={prg} />
				) : (
					<MinimalPrgSelector setPrg={setPrg} />
				)}
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
											<LevelsVisualizerWithPeDownload prg={prg} />
										</Card>
										<Card>
											<h2>Patch</h2>
											<LevelsPatcher prg={prg} />
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
											<SpritesVisualizerWithBinDownload prg={prg} />
										</Card>
										<Card>
											<h2>Patch</h2>
											<SpritesPatcher prg={prg} />
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
