import { TabBar } from "./TabBar";
import { PatchLevels } from "./PatchLevels";
import styled from "styled-components";
import { PatchSprites } from "./PatchSprites";
import { useParsePrg } from "./useParsePrg";
import { useSpriteBinParsePrg } from "./useSpriteBinParsePrg";

const Page = styled.div`
	width: 600px;
	margin: 0 auto;
	padding: 1rem;
	text-align: center;
`;

export function App() {
	const [parsedPrgData, setPrgA] = useParsePrg();
	const [parsedSpriteBinPrgData, setPrgB] = useSpriteBinParsePrg();
	const setPrg = async (file: File | undefined): Promise<void> => {
		setPrgA(file);
		setPrgB(file);
	};

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
						render: () => (
							<PatchLevels parsedPrgData={parsedPrgData} setPrg={setPrg} />
						),
					},
					patchSprites: {
						title: "Patch Sprites",
						render: () => (
							<PatchSprites
								parsedSpriteBinPrgData={parsedSpriteBinPrgData}
								setPrg={setPrg}
							/>
						),
					},
				}}
			/>
		</Page>
	);
}
