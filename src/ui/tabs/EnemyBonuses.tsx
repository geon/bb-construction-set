import { ReactNode, useState } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import styled from "styled-components";
import { checkedAccess, updateArrayAtIndex } from "../../bb/functions";
import { CharBlockSelector } from "../CharBlockSelector";
import { assertTuple } from "../../bb/tuple";
import { getCharPalette } from "../../bb/palette-image/char";
import { BgColors } from "../../bb/internal-data-formats/bg-colors";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

export function EnemyBonuses(props: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	const [bonusIndex, setBonusIndex] = useState(0);

	const bgColors: BgColors = {
		// Global sprite colors
		light: 1,
		dark: 2,
	};

	return (
		<Styling>
			<CharBlockSelector
				charBlocks={props.parsedPrg.enemyDeathBonusIndices.map((bonusIndex) => {
					const item = checkedAccess(props.parsedPrg.items.points, bonusIndex);
					return {
						charBlock: checkedAccess(
							props.parsedPrg.chars.items,
							item.charBlockIndex
						),
						palette: getCharPalette(item.paletteIndex, bgColors),
					};
				})}
				charBlockIndex={bonusIndex}
				setCharBlockIndex={setBonusIndex}
			/>
			<CharBlockSelector
				charBlocks={props.parsedPrg.items.points.map((item) => ({
					charBlock: checkedAccess(
						props.parsedPrg.chars.items,
						item.charBlockIndex
					),
					palette: getCharPalette(item.paletteIndex, bgColors),
				}))}
				charBlockIndex={checkedAccess(
					props.parsedPrg.enemyDeathBonusIndices,
					bonusIndex
				)}
				setCharBlockIndex={(itemIndex) => {
					props.setParsedPrg({
						...props.parsedPrg,
						enemyDeathBonusIndices: assertTuple(
							updateArrayAtIndex(
								props.parsedPrg.enemyDeathBonusIndices,
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
