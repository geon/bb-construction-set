import styled from "styled-components";
import { PaletteIndex, rgbPalette } from "../bb/internal-data-formats/palette";

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

export const Palette = styled(
	(props: {
		readonly selectePaletteIndex: PaletteIndex;
		readonly options: readonly PaletteIndex[];
		readonly onPick: (paletteIndex: PaletteIndex) => void;
		readonly className?: string;
	}): JSX.Element => {
		return (
			<nav className={props.className}>
				{props.options.map((index) => {
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
