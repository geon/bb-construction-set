import { ReactNode, useState } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { ImageDataCanvas } from "../ImageDataCanvas";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { doubleImageWidth } from "../../bb/palette-image/palette-image";
import { drawItem } from "../../bb/palette-image/item";
import { CharBlock } from "../../bb/internal-data-formats/char-group";
import styled from "styled-components";
import { palette, PaletteIndex } from "../../bb/internal-data-formats/palette";
import { range, updateArrayAtIndex } from "../../bb/functions";
import {
	ItemCategoryName,
	validItemCategoryNames,
} from "../../bb/prg/data-locations";

const Styling = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3em;
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
	const [selectedItemCategoryName, setSelectedItemCategoryName] = useState<
		ItemCategoryName | undefined
	>();

	const objectFromUseState = function <T>([value, set]: ReturnType<
		typeof useState<T>
	>) {
		return { value, set };
	};

	const itemStates = {
		points: objectFromUseState(useState<number | undefined>()),
		powerups: objectFromUseState(useState<number | undefined>()),
	};

	const selectedItemIndex =
		selectedItemCategoryName && itemStates[selectedItemCategoryName].value;

	return (
		<Styling>
			{validItemCategoryNames.map((itemCategoryName) => (
				<ItemSelector
					key={itemCategoryName}
					parsedPrg={parsedPrg}
					levelIndex={levelIndex}
					itemCategoryName={itemCategoryName}
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
			))}
			<Palette
				onPick={(paletteIndex) => {
					if (!(selectedItemCategoryName && selectedItemIndex !== undefined)) {
						return;
					}

					setParsedPrg({
						...parsedPrg,
						items: {
							...parsedPrg.items,
							[selectedItemCategoryName]: updateArrayAtIndex(
								parsedPrg.items[selectedItemCategoryName],
								selectedItemIndex,
								(item) => ({
									...item,
									paletteIndex,
								})
							),
						},
					});
				}}
			/>
		</Styling>
	);
}

const ItemSelector = styled(
	(props: {
		readonly parsedPrg: ParsedPrg;
		readonly levelIndex: number;
		readonly itemCategoryName: ItemCategoryName;
		readonly itemIndex: number | undefined;
		readonly setItemIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{props.parsedPrg.items[props.itemCategoryName].map(
					(item, itemIndex) => (
						<ImageDataCanvas
							key={itemIndex}
							className={itemIndex === props.itemIndex ? "active" : undefined}
							imageData={imageDataFromPaletteImage(
								doubleImageWidth(
									drawItem(
										item,
										props.parsedPrg.chars.items as ReadonlyArray<
											CharBlock<2, 2>
										>,
										props.parsedPrg.levels[props.levelIndex]!
									)
								)
							)}
							onClick={() => props.setItemIndex(itemIndex)}
							style={{ cursor: "pointer", width: "32px" }}
						/>
					)
				)}
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

const PaletteIndexButton = styled.button<{ $paletteIndex: PaletteIndex }>`
	background-color: ${({ $paletteIndex }) =>
		`rgb(${Object.values(palette[$paletteIndex]).join(", ")})`};
	padding: 0;
`;

const pickerSize = "2em";
const Palette = styled(
	(props: {
		readonly onPick: (paletteIndex: PaletteIndex) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<>
				<nav className={props.className}>
					{range(8).map((index) => {
						const paletteIndex = index as PaletteIndex;
						return (
							<PaletteIndexButton
								key={paletteIndex}
								$paletteIndex={paletteIndex}
								onClick={() => props.onPick(paletteIndex)}
							/>
						);
					})}
				</nav>
			</>
		);
	}
)`
	display: flex;
	gap: 8px;
	justify-content: center;

	> ${PaletteIndexButton} {
		width: ${pickerSize};
		height: ${pickerSize};
		border-radius: 10000px;
	}
`;
