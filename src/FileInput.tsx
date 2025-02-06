import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

export function FileInput({
	accept,
	onChange,
	...props
}: Omit<ComponentPropsWithoutRef<"button">, "onChange"> & {
	readonly accept: ReadonlyArray<string>;
	readonly onChange: (file: File | undefined) => void;
}): JSX.Element {
	const ref = useRefButItActuallyWorks();

	return (
		<>
			<button
				{...props}
				disabled={!ref.current}
				onClick={() => ref.current?.click?.()}
			/>
			<input
				ref={ref.prop}
				type="file"
				accept={accept.join(",")}
				style={{ display: "none" }}
				onChange={(event) => {
					onChange(event.target.files?.[0]);
					// Clear the input, so the same file can trigger it consecutively.
					event.target.value = "";
				}}
			/>
		</>
	);
}

function useRefButItActuallyWorks() {
	const prop = useRef<HTMLInputElement>(null);
	const [current, setCurrent] = useState(prop.current);
	useEffect(() => {
		setCurrent(prop.current);
	});
	return { prop, current };
}
