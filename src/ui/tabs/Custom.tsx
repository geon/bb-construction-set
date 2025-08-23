import { ReactNode, useState } from "react";
import styled from "styled-components";
import { Patch, SingleBytePatch } from "../../bb/prg/io";

const TextArea = styled.textarea<{ $error?: boolean }>`
	color: ${({ $error }) => ($error ? "#a00" : "inherit")};
	padding: 1em;
	box-sizing: border-box;
	width: 100%;
	height: 20em;
`;

export function Custom(props: {
	readonly manualPatch: Patch;
	readonly setManualPatch: (manualPatch: Patch) => void;
}): ReactNode {
	const [inputState, setInputState] = useState(
		formatViceMonitorPokes(props.manualPatch)
	);
	const [error, setError] = useState(false);
	return (
		<>
			<TextArea
				value={inputState}
				$error={error}
				onChange={(e) => {
					const targetValue = e.target.value;
					setInputState(targetValue);
					const patch = parseViceMonitorPokes(targetValue);
					setError(!patch);
					if (patch) {
						props.setManualPatch(patch);
					}
				}}
			/>
		</>
	);
}

function parseViceMonitorPokes(value: string): Patch | undefined {
	try {
		return value.split("\n").map((line): SingleBytePatch => {
			const strings = line.split(" ").filter((x) => x !== "");

			const caret = strings.shift();
			if (caret !== ">") {
				throw new Error("Lines must start with a >");
			}

			const numbers = strings
				.map((x) => {
					const number = parseInt(x, 16);
					if (Number.isNaN(number)) {
						throw new Error("Not a number: " + x);
					}
					return number;
				})
				.filter((x) => !Number.isNaN(x));
			const [address, value] = numbers;
			if (!(address !== undefined && value !== undefined)) {
				throw new Error(
					"Lines must have exactly one address and one value, separated with a space."
				);
			}

			return [address, value];
		});
	} catch (e) {
		return undefined;
	}
}

function formatViceMonitorPokes(manual: Patch): string {
	return manual
		.map((byte) => `> ${byte[0].toString(16)} ${byte[1].toString(16)}`)
		.join("\n");
}
