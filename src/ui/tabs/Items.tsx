import { ReactNode, useState } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";
import { drawItem } from "../../bb/palette-image/item";
import {
	CharBlock,
	CharGroup,
} from "../../bb/internal-data-formats/char-group";
import styled from "styled-components";
import {
	palette,
	PaletteIndex,
	SubPalette,
} from "../../bb/internal-data-formats/palette";
import { checkedAccess, range, updateArrayAtIndex } from "../../bb/functions";
import {
	ItemCategoryName,
	validItemCategoryNames,
} from "../../bb/prg/data-locations";
import { drawCharBlock, getCharPalette } from "../../bb/palette-image/char";
import { Item } from "../../bb/internal-data-formats/item-groups";
import { TabBar } from "../TabBar";
import { Level } from "../../bb/internal-data-formats/level";

const ItemSelector = styled(
	(props: {
		readonly items: ReadonlyArray<Item>;
		readonly chars: CharGroup<2, 2>;
		readonly bgColors: Pick<Level, "bgColorDark" | "bgColorLight">;
		readonly itemIndex: number | undefined;
		readonly setItemIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{props.items.map((item, itemIndex) => (
					<ImageDataCanvas
						key={itemIndex}
						className={itemIndex === props.itemIndex ? "active" : undefined}
						imageData={imageDataFromPaletteImage(
							doubleImageWidth(drawItem(item, props.chars, props.bgColors))
						)}
						onClick={() => props.setItemIndex(itemIndex)}
						style={{ cursor: "pointer", width: "32px" }}
					/>
				))}
			</nav>
		);
	}
)`
	display: grid;
	grid-template-columns: repeat(10, auto);
	grid-column-gap: 16px;
	grid-row-gap: 16px;
	justify-items: center;
	justify-content: center;

	> .active {
		box-shadow: 0 0 0 2px black, 0 0 0 3px white;
		@media (prefers-color-scheme: light) {
			box-shadow: 0 0 0 2px white, 0 0 0 3px black;
		}
	}
`;

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
		`rgb(${Object.values(palette[$paletteIndex]).join(", ")})`};

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

const CharBlockSelector = styled(
	(props: {
		readonly charBlocks: ReadonlyArray<CharBlock<2, 2>>;
		readonly palette: SubPalette;
		readonly charBlockIndex: number;
		readonly setCharBlockIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{props.charBlocks.map((item, itemIndex) => (
					<ImageDataCanvas
						key={itemIndex}
						className={
							itemIndex === props.charBlockIndex ? "active" : undefined
						}
						imageData={imageDataFromPaletteImage(
							doubleImageWidth(drawCharBlock(item, props.palette))
						)}
						onClick={() => props.setCharBlockIndex(itemIndex)}
						style={{ cursor: "pointer", width: "32px" }}
					/>
				))}
			</nav>
		);
	}
)`
	display: grid;
	grid-template-columns: repeat(10, auto);
	grid-column-gap: 16px;
	grid-row-gap: 16px;
	justify-items: center;
	justify-content: center;

	> .active {
		box-shadow: 0 0 0 2px black, 0 0 0 3px white;
		@media (prefers-color-scheme: light) {
			box-shadow: 0 0 0 2px white, 0 0 0 3px black;
		}
	}
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
					<ItemSelector
						items={parsedPrg.items[itemCategoryName]}
						chars={parsedPrg.chars.items as CharGroup<2, 2>}
						bgColors={checkedAccess(parsedPrg.levels, levelIndex)}
						itemIndex={
							selectedItemCategoryName !== itemCategoryName
								? undefined
								: selectedItemIndex
						}
						setItemIndex={(itemIndex) => {
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
							return (
								<CharBlockSelector
									charBlocks={
										parsedPrg.chars.items as ReadonlyArray<CharBlock<2, 2>>
									}
									palette={getCharPalette(
										checkedAccess(
											parsedPrg.items[selectedItemCategoryName],
											selectedItemIndex
										).paletteIndex,
										checkedAccess(parsedPrg.levels, levelIndex)
									)}
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
