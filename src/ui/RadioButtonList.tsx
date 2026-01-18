import { ReactNode } from "react";
import { objectEntries } from "../bb/functions";

type RadioButtonListProps<T extends string> = {
	readonly selected: NoInfer<T> | undefined;
	readonly setSelected: (newSelected: NoInfer<T>) => void;
	readonly options: Record<T, string>;

	readonly className?: string;
};

export const RadioButtonList: <T extends string>(
	props: RadioButtonListProps<T>,
) => ReactNode = (props) => {
	return (
		<>
			{objectEntries(props.options).map(([name, label]) => (
				<RadioButton
					key={name}
					checked={props.selected === name}
					onSelect={() => props.setSelected(name)}
					label={label}
				/>
			))}
		</>
	);
};

function RadioButton(props: {
	readonly checked: boolean;
	readonly onSelect: () => void;
	readonly label: string;
}): ReactNode {
	return (
		<label>
			<input type="radio" checked={props.checked} onChange={props.onSelect} />{" "}
			{props.label}
		</label>
	);
}
