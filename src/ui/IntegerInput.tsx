import { ParsedInput } from "./ParsedInput";
import { Setter } from "./types";

export function IntegerInput(props: {
	value: number;
	onChange: Setter<number>;
}) {
	return (
		<ParsedInput
			value={props.value}
			onChange={props.onChange}
			parse={(text) => {
				const num = parseInt(text, 10);
				return Number.isNaN(num) ? undefined : num;
			}}
			serialize={(value) => value.toString()}
		/>
	);
}
