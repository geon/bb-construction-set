import "./App.css";
import { TabBar } from "./TabBar";
import { PatchLevels } from "./PatchLevels";

export function App() {
	return (
		<>
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
		</>
	);
}
