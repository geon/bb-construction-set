import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import styled from "styled-components";
import { TabBar } from "../TabBar";
import { Platforms } from "./Platforms";
import { LevelGraphics } from "./LevelGraphics";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

export function Levels(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
	readonly setLevelIndex: (index: number) => void;
}): ReactNode {
	return (
		<Styling>
			<TabBar
				initialTabId={"tiles"}
				tabs={{
					tiles: {
						title: "Platforms",
						render: () => (
							<Platforms
								setParsedPrg={props.setParsedPrg}
								parsedPrg={props.parsedPrg}
							/>
						),
					},
					levelGraphics: {
						title: "Level Graphics",
						render: () => (
							<LevelGraphics
								parsedPrg={props.parsedPrg}
								setParsedPrg={props.setParsedPrg}
								levelIndex={props.levelIndex}
								setLevelIndex={props.setLevelIndex}
							/>
						),
					},
				}}
			/>
		</Styling>
	);
}
