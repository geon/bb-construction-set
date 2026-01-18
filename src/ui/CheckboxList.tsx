import { ReactNode } from "react";

type CheckboxListProps<T extends string> = {
	readonly selected: Record<T, boolean>;
	readonly disabled: Partial<Record<T, boolean>>;
	readonly setSelected: (newSelected: Record<T, boolean>) => void;
	readonly options: Record<T, string>;

	readonly className?: string;
};

export const CheckboxList: <T extends string>(
	props: CheckboxListProps<T>,
) => ReactNode = (props: CheckboxListProps<string>) => {
	const toggle = (name: string): void => {
		props.setSelected({ ...props.selected, [name]: !props.selected[name] });
	};

	return (
		<>
			{Object.entries(props.options).map(([name, label]) => (
				<Checkbox
					key={name}
					checked={!!props.selected[name]}
					disabled={props.disabled[name]}
					onToggle={() => toggle(name)}
					label={label}
				/>
			))}
		</>
	);
};

function Checkbox(props: {
	readonly checked: boolean;
	readonly disabled?: boolean;
	readonly onToggle: () => void;
	readonly label: string;
}): ReactNode {
	return (
		<label style={props.disabled ? { opacity: 0.5 } : undefined}>
			<input
				type="checkbox"
				checked={props.checked}
				disabled={props.disabled}
				onChange={props.onToggle}
			/>{" "}
			{props.label}
		</label>
	);
}
