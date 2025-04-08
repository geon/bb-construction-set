import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

type CallbackArg<Multiple> = Multiple extends true
	? readonly File[]
	: Multiple extends false | undefined
	? File | undefined
	: never;
export function FileInput<Multiple extends boolean = false>({
	multiple,
	accept,
	onChange,
	...props
}: Omit<ComponentPropsWithoutRef<"button">, "onChange"> & {
	readonly multiple?: Multiple;
	readonly accept: ReadonlyArray<string>;
	readonly onChange: (files: CallbackArg<Multiple>) => void;
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
				multiple={multiple}
				style={{ display: "none" }}
				onChange={(event) => {
					if (multiple) {
						(onChange as (arg: CallbackArg<true>) => void)([
							...(event.target.files ?? []),
						]);
					} else {
						(onChange as (arg: CallbackArg<false>) => void)(
							event.target.files?.[0]
						);
					}
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
