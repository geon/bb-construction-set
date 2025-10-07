import { ReactNode } from "react";
import { updateArrayAtIndex } from "../../bb/functions";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import styled from "styled-components";
import { Tiles } from "../../bb/internal-data-formats/level";
import { TabBar } from "../TabBar";
import { PlatformEditor } from "./PlatformEditor";
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

export const ImageButtons = styled.div`
	display: flex;
	flex-direction: row;
	gap: 1em;
`;

export function Levels(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
	readonly setLevelIndex: (index: number) => void;
}): ReactNode {
	const level = props.parsedPrg.levels[props.levelIndex]!;
	const setTiles = (tiles: Tiles) =>
		props.setParsedPrg({
			...props.parsedPrg,
			levels: updateArrayAtIndex(
				props.parsedPrg.levels,
				props.levelIndex,
				(level) => ({
					...level,
					tiles,
				})
			),
		});

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
					quickDoodle: {
						title: "Quick Doodle",
						render: () => (
							<PlatformEditor tiles={level.tiles} setTiles={setTiles} />
						),
					},
				}}
			/>
		</Styling>
	);
}
