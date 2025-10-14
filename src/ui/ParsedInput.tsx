import { useState, useEffect } from "react";
import { Setter } from "./types";

export function ParsedInput<T>(props: {
	value: T;
	onChange: Setter<T>;
	parse: (text: string) => T | undefined;
	serialize: (value: T) => string;
}): React.ReactNode {
	const [text, setText] = useState<string>(props.serialize(props.value));
	useEffect(() => {
		setText(props.serialize(props.value));
	}, [props.value]);

	function handleChange(newText: string) {
		const num = props.parse(newText);
		if (num === undefined) {
			return;
		}
		props.onChange(num);
		setText(props.serialize(num));
	}

	return (
		<input
			value={text}
			onChange={(event) => setText(event.currentTarget.value)}
			onKeyDown={(event) => event.key === "Enter" && handleChange(text)}
			onBlur={() => handleChange(text)}
			size={4}
		/>
	);
}
