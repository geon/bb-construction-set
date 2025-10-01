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

export function Levels({
	parsedPrg,
	setParsedPrg,
	levelIndex,
	setLevelIndex,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
	readonly setLevelIndex: (index: number) => void;
}): ReactNode {
	const level = parsedPrg.levels[levelIndex]!;
	const setTiles = (tiles: Tiles) =>
		setParsedPrg({
			...parsedPrg,
			levels: updateArrayAtIndex(parsedPrg.levels, levelIndex, (level) => ({
				...level,
				tiles,
			})),
		});

	return (
		<Styling>
			<TabBar
				initialTabId={"tiles"}
				tabs={{
					tiles: {
						title: "Platforms",
						render: () => (
							<Platforms setParsedPrg={setParsedPrg} parsedPrg={parsedPrg} />
						),
					},
					levelGraphics: {
						title: "Level Graphics",
						render: () => (
							<LevelGraphics
								parsedPrg={parsedPrg}
								setParsedPrg={setParsedPrg}
								levelIndex={levelIndex}
								setLevelIndex={setLevelIndex}
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
