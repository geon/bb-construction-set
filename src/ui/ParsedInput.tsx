import { useState, useEffect } from "react";
import { Setter } from "./types";

export function ParsedInput<T>(props: {
	value: T;
	onChange: Setter<T>;
	parse: (text: string) => T | undefined;
	serialize: (value: T) => string;
}): React.ReactNode {
	const [text, setText] = useState<string | undefined>(undefined);
	useEffect(() => {
		setText(undefined);
	}, [props.value]);

	function handleChange(newText: string) {
		const num = props.parse(newText);
		if (num === undefined) {
			return;
		}
		props.onChange(num);
		setText(undefined);
	}

	return (
		<input
			value={text ?? props.serialize(props.value)}
			onChange={(event) => setText(event.currentTarget.value)}
			onKeyDown={
				text === undefined
					? undefined
					: (event) => event.key === "Enter" && handleChange(text)
			}
			onBlur={text === undefined ? undefined : () => handleChange(text)}
			size={4}
		/>
	);
}
