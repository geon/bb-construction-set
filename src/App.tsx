import { TabBar } from "./TabBar";
import { PatchLevels } from "./PatchLevels";
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
			<p>
				Drag an unpacked prg onto this{" "}
				<a href={new URL("/pack.bat", import.meta.url).href} download>
					.bat-file
				</a>{" "}
				to pack it for execution.
			</p>
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
				}}
			/>
		</Page>
	);
}
