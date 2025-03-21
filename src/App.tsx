import { TabBar } from "./TabBar";
import { PatchLevels } from "./PatchLevels";
import styled from "styled-components";
import { PatchSprites } from "./PatchSprites";
import { Card } from "./Card";
import { MinimalPrgSelector } from "./MinimalPrgSelector";
import { useState } from "react";

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
	const [prg, setPrg] = useState<File | undefined>();

	return (
		<Page>
			<h1>BB Construction Set</h1>
			<p>
				Drag an unpacked prg onto this{" "}
				<a href={new URL("/pack.bat", import.meta.url).href} download>
					.bat-file
				</a>{" "}
				to pack it for execution.
			</p>
			<Card>
				<MinimalPrgSelector setPrg={setPrg} />
			</Card>
			{prg && (
				<TabBar
					initialTabId={"patchLevels"}
					tabs={{
						patchLevels: {
							title: "Patch Levels",
							render: () => <PatchLevels prg={prg} />,
						},
						patchSprites: {
							title: "Patch Sprites",
							render: () => <PatchSprites prg={prg} />,
						},
					}}
				/>
			)}
		</Page>
	);
}
