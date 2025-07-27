import { ReactNode, useState } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { CharGroup } from "../../bb/internal-data-formats/char-group";
import styled from "styled-components";
import { checkedAccess, updateArrayAtIndex } from "../../bb/functions";
import { CharBlockSelector } from "../CharBlockSelector";
import { assertTuple } from "../../bb/tuple";
import { getCharPalette } from "../../bb/palette-image/char";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

export function EnemyBonuses({
	parsedPrg,
	setParsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	const [bonusIndex, setBonusIndex] = useState(0);

	const bgColors = {
		// Global sprite colors
		bgColorLight: 1,
		bgColorDark: 2,
	} as const;

	return (
		<Styling>
			<CharBlockSelector
				charBlocks={parsedPrg.enemyDeathBonusIndices.map((bonusIndex) => {
					const item = checkedAccess(parsedPrg.items.points, bonusIndex);
					return {
						charBlock: checkedAccess(
							parsedPrg.chars.items as CharGroup<2, 2>,
							item.charBlockIndex
						),
						palette: getCharPalette(item.paletteIndex, bgColors),
					};
				})}
				charBlockIndex={bonusIndex}
				setCharBlockIndex={setBonusIndex}
			/>
			<CharBlockSelector
				charBlocks={parsedPrg.items.points.map((item) => ({
					charBlock: checkedAccess(
						parsedPrg.chars.items as CharGroup<2, 2>,
						item.charBlockIndex
					),
					palette: getCharPalette(item.paletteIndex, bgColors),
				}))}
				charBlockIndex={checkedAccess(
					parsedPrg.enemyDeathBonusIndices,
					bonusIndex
				)}
				setCharBlockIndex={(itemIndex) => {
					setParsedPrg({
						...parsedPrg,
						enemyDeathBonusIndices: assertTuple(
							updateArrayAtIndex(
								parsedPrg.enemyDeathBonusIndices,
								bonusIndex,
								() => itemIndex
							),
							6
						),
					});
				}}
			/>
		</Styling>
	);
}
