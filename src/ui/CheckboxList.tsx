import { ReactNode } from "react";
import styled from "styled-components";

type CheckboxListProps<T extends string> = {
	readonly selected: Set<T>;
	readonly setSelected: (newSelected: Set<T>) => void;
	readonly options: Record<T, string>;

	readonly className?: string;
};

export const CheckboxList: <T extends string>(
	props: CheckboxListProps<T>
) => ReactNode = styled((props: CheckboxListProps<string>) => {
	const toggle = (name: string): void => {
		const newSelected = new Set(props.selected);
		newSelected.has(name) ? newSelected.delete(name) : newSelected.add(name);
		props.setSelected(newSelected);
	};

	return (
		<div className={props.className}>
			{Object.entries(props.options).map(([name, label]) => (
				<Checkbox
					key={name}
					checked={props.selected.has(name)}
					onToggle={() => toggle(name)}
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

function Checkbox(props: {
	readonly checked: boolean;
	readonly onToggle: () => void;
	readonly label: string;
}): ReactNode {
	return (
		<label>
			<input
				type="checkbox"
				checked={props.checked}
				onChange={props.onToggle}
			/>{" "}
			{props.label}
		</label>
	);
}
