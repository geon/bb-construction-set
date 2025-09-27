import { ReactNode, useState } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import {
	CharBlock,
	CharGroup,
} from "../../bb/internal-data-formats/char-group";
import styled from "styled-components";
import {
	rgbPalette,
	PaletteIndex,
} from "../../bb/internal-data-formats/palette";
import { checkedAccess, range, updateArrayAtIndex } from "../../bb/functions";
import {
	ItemCategoryName,
	validItemCategoryNames,
} from "../../bb/prg/data-locations";
import { Item } from "../../bb/internal-data-formats/item-groups";
import { TabBar } from "../TabBar";
import { CharBlockSelector } from "../CharBlockSelector";
import { getCharPalette } from "../../bb/palette-image/char";

const pickerSize = "2em";
const PaletteIndexButton = styled.button.attrs<{ selected: boolean }>(
	(props) => ({
		className: props.selected ? "selected" : "",
	})
)<{
	readonly $paletteIndex: PaletteIndex;
}>`
	width: ${pickerSize};
	height: ${pickerSize};
	border-radius: 10000px;
	padding: 0;

	background-color: ${({ $paletteIndex }) =>
		`rgb(${Object.values(rgbPalette[$paletteIndex]).join(", ")})`};

	&.selected {
		box-shadow: 0 0 0 2px black, 0 0 0 3px white;
		@media (prefers-color-scheme: light) {
			box-shadow: 0 0 0 2px white, 0 0 0 3px black;
		}
	}
`;
const Palette = styled(
	(props: {
		readonly selectePaletteIndex: PaletteIndex;
		readonly onPick: (paletteIndex: PaletteIndex) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{range(8).map((index) => {
					const paletteIndex = index as PaletteIndex;
					return (
						<PaletteIndexButton
							key={paletteIndex}
							$paletteIndex={paletteIndex}
							selected={paletteIndex === props.selectePaletteIndex}
							onClick={() => props.onPick(paletteIndex)}
						/>
					);
				})}
			</nav>
		);
	}
)`
	display: flex;
	gap: 8px;
	justify-content: center;
`;

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;

	h3 {
		text-align: left;
	}
`;

export function Items({
	parsedPrg,
	setParsedPrg,
	levelIndex,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
	readonly levelIndex: number;
}): ReactNode {
	const [selectedItemCategoryName, setSelectedItemCategoryName] =
		useState<ItemCategoryName>("points");

	const objectFromUseState = function <T>([value, set]: [
		T,
		(value: T) => void
	]) {
		return { value, set };
	};

	const itemStates = {
		points: objectFromUseState(useState(0)),
		powerups: objectFromUseState(useState(0)),
	};

	const selectedItemIndex =
		selectedItemCategoryName && itemStates[selectedItemCategoryName].value;

	return (
		<Styling>
			{validItemCategoryNames.map((itemCategoryName) => (
				<div key={itemCategoryName}>
					<h3>
						{
							(
								{
									points: "Points",
									powerups: "Power-Ups",
								} as const
							)[itemCategoryName]
						}
					</h3>
					<CharBlockSelector
						charBlocks={parsedPrg.items[itemCategoryName].map((item) => ({
							charBlock: checkedAccess(
								parsedPrg.chars.items as CharGroup<2, 2>,
								item.charBlockIndex
							),
							palette: getCharPalette(
								item.paletteIndex,
								checkedAccess(parsedPrg.levels, levelIndex)
							),
						}))}
						charBlockIndex={
							selectedItemCategoryName !== itemCategoryName
								? undefined
								: selectedItemIndex
						}
						setCharBlockIndex={(itemIndex) => {
							setSelectedItemCategoryName(itemCategoryName);
							itemStates[itemCategoryName].set(itemIndex);
						}}
					/>
				</div>
			))}

			<TabBar
				initialTabId={"paletteIndex" as keyof Item}
				tabs={{
					paletteIndex: {
						title: "Color",
						render: () => {
							return (
								<Palette
									selectePaletteIndex={
										checkedAccess(
											parsedPrg.items[selectedItemCategoryName],
											selectedItemIndex
										).paletteIndex
									}
									onPick={(paletteIndex) => {
										setParsedPrg({
											...parsedPrg,
											items: {
												...parsedPrg.items,
												[selectedItemCategoryName]: updateArrayAtIndex(
													parsedPrg.items[selectedItemCategoryName],
													selectedItemIndex,
													(item): Item => ({
														...item,
														paletteIndex,
													})
												),
											},
										});
									}}
								/>
							);
						},
					},
					charBlockIndex: {
						title: "Chars",
						render: () => {
							const paletteIndex = checkedAccess(
								parsedPrg.items[selectedItemCategoryName],
								selectedItemIndex
							).paletteIndex;

							return (
								<CharBlockSelector
									charBlocks={(
										parsedPrg.chars.items as ReadonlyArray<CharBlock<2, 2>>
									).map((charBlock) => ({
										charBlock,
										palette: getCharPalette(
											paletteIndex,
											checkedAccess(parsedPrg.levels, levelIndex)
										),
									}))}
									charBlockIndex={
										checkedAccess(
											parsedPrg.items[selectedItemCategoryName],
											selectedItemIndex
										).charBlockIndex
									}
									setCharBlockIndex={(charBlockIndex) => {
										setParsedPrg({
											...parsedPrg,
											items: {
												...parsedPrg.items,
												[selectedItemCategoryName]: updateArrayAtIndex(
													parsedPrg.items[selectedItemCategoryName],
													selectedItemIndex,
													(item): Item => ({
														...item,
														charBlockIndex,
													})
												),
											},
										});
									}}
								/>
							);
						},
					},
				}}
			/>
		</Styling>
	);
}
