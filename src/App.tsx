import { TabBar } from "./TabBar";
import { PatchLevels } from "./PatchLevels";
import { ReformatPe } from "./ReformatPe";
import styled from "styled-components";
import { PatchSprites } from "./PatchSprites";

const Page = styled.div`
	width: 600px;
	margin: 0 auto;
	padding: 1rem;
	text-align: center;
`;

export function App() {
	return (
		<Page>
			<h1>BB Construction Set</h1>
			<TabBar
				initialTabId={"patchLevels"}
				tabs={{
					patchLevels: {
						title: "Patch Levels",
						render: () => <PatchLevels />,
					},
					patchSprites: {
						title: "Patch Sprites",
						render: () => <PatchSprites />,
					},
					reformatLevels: {
						title: "Reformat Pe",
						render: () => <ReformatPe />,
					},
				}}
			/>
		</Page>
	);
}
