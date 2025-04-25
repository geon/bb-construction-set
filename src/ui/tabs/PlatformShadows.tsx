import { ReactNode } from "react";
import { ParsedPrg } from "../../bb/internal-data-formats/parsed-prg";
import { drawLevel } from "../../bb/image-data/draw-levels-to-canvas";
import { ImageDataCanvas } from "../ImageDataCanvas";
import styled from "styled-components";
import { ShadowStyle } from "../../bb/prg/shadow-chars";

export function PlatformShadows({
	parsedPrg,
	setParsedPrg,
}: {
	readonly parsedPrg: ParsedPrg;
	readonly setParsedPrg: (parsedPrg: ParsedPrg) => void;
}): ReactNode {
	return (
		<>
			<ImageDataCanvas
				imageData={drawLevel(
					parsedPrg.levels[4]!,
					parsedPrg.sprites,
					parsedPrg.shadowStyle
				)}
			/>
			<br />
			<br />
			<RadioButtonList
				options={
					{
						retroForge: "Retro Forge",
						originalC64: "Original C64",
					} satisfies Record<ShadowStyle, string>
				}
				selected={parsedPrg.shadowStyle}
				setSelected={(shadowStyle) =>
					setParsedPrg({ ...parsedPrg, shadowStyle })
				}
			/>
		</>
	);
}

type RadioButtonListProps<T extends string> = {
	readonly selected: T;
	readonly setSelected: (newSelected: T) => void;
	readonly options: Record<T, string>;

	readonly className?: string;
};

export const RadioButtonList: <T extends string>(
	props: RadioButtonListProps<T>
) => ReactNode = styled((props: RadioButtonListProps<string>) => {
	return (
		<div className={props.className}>
			{Object.entries(props.options).map(([name, label]) => (
				<RadioButton
					key={name}
					checked={props.selected === name}
					onToggle={() => props.setSelected(name)}
					label={label}
				/>
			))}
		</div>
	);
})`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	width: 200px;
	margin: auto;
`;

function RadioButton(props: {
	readonly checked: boolean;
	readonly onToggle: () => void;
	readonly label: string;
}): ReactNode {
	return (
		<label>
			<input type="radio" checked={props.checked} onChange={props.onToggle} />{" "}
			{props.label}
		</label>
	);
}
