import { ComponentPropsWithoutRef } from "react";

type CallbackArg<Multiple> = Multiple extends true
	? readonly File[]
	: Multiple extends false | undefined
		? File
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
	return (
		<button
			{...props}
			onClick={() => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = accept.join(",");
				input.multiple = !!multiple;
				input.onchange = (event) => {
					const target = event.target as HTMLInputElement;
					const files = target.files;
					if (!files) {
						// https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/files
						// > A FileList object listing the selected files, if any, or null if the HTMLInputElement is not of type="file".
						throw new Error("No files property on input.");
					}

					if (multiple) {
						(onChange as (arg: CallbackArg<true>) => void)([...files]);
					} else {
						if (!files[0]) {
							throw new Error("Empty file selection.");
						}
						(onChange as (arg: CallbackArg<false>) => void)(files[0]);
					}
					// Clear the input, so the same file can trigger it consecutively.
					target.value = "";
				};
				input.click();
			}}
		/>
	);
}
