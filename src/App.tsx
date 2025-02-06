import { TabBar } from "./TabBar";
import { PatchLevels } from "./PatchLevels";
import styled from "styled-components";

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
					reformatLevels: {
						title: "Reformat Levels",
						render: () => (
							<>
								<p>Placeholder</p>
							</>
						),
					},
				}}
			/>
		</Page>
	);
}
