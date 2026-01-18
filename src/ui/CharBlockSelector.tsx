import styled from "styled-components";
import { imageDataFromPaletteImage } from "../bb/image-data/image-data";
import { SubPalette } from "../bb/internal-data-formats/palette";
import { drawCharBlock } from "../bb/palette-image/char";
import { doubleImageWidth } from "../bb/palette-image/palette-image";
import { ImageDataCanvas } from "./ImageDataCanvas";
import { CharBlock } from "../bb/internal-data-formats/char-block";

export const CharBlockSelector = styled(
	(props: {
		readonly charBlocks: ReadonlyArray<{
			readonly title?: string;
			readonly charBlock: CharBlock;
			readonly palette: SubPalette;
		}>;
		readonly charBlockIndex?: number;
		readonly setCharBlockIndex: (index: number) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{props.charBlocks.map((item, itemIndex) => (
					<ImageDataCanvas
						key={itemIndex}
						title={item.title}
						className={
							itemIndex === props.charBlockIndex ? "active" : undefined
						}
						imageData={imageDataFromPaletteImage(
							doubleImageWidth(drawCharBlock(item.charBlock, item.palette)),
						)}
						onClick={() => props.setCharBlockIndex(itemIndex)}
						style={{ cursor: "pointer", width: "32px" }}
					/>
				))}
			</nav>
		);
	},
)`
	display: grid;
	grid-template-columns: repeat(10, auto);
	grid-column-gap: 16px;
	grid-row-gap: 16px;
	justify-items: center;
	justify-content: center;

	> .active {
		box-shadow:
			0 0 0 2px black,
			0 0 0 3px white;
		@media (prefers-color-scheme: light) {
			box-shadow:
				0 0 0 2px white,
				0 0 0 3px black;
		}
	}
`;
