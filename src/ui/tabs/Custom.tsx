import { ReactNode, useState } from "react";
import styled from "styled-components";
import { Patch, SingleBytePatch } from "../../bb/prg/io";
import { assertTuple } from "../../bb/tuple";

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

	function setManualPatch(patch: Patch): void {
		props.setManualPatch(patch);
		setInputState(formatViceMonitorPokes(patch));
	}

	return (
		<>
			<TextArea
				value={inputState}
				$error={error}
				onChange={(e) => {
					const newInputState = e.target.value;
					const patch = parseViceMonitorPokes(newInputState);
					setError(!patch);
					if (patch) {
						setManualPatch(patch);
					} else {
						setInputState(newInputState);
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

			const numbers = strings.map((x) => {
				const number = parseInt(x, 16);
				if (Number.isNaN(number)) {
					throw new Error("Not a number: " + x);
				}
				return number;
			});

			try {
				const [address, value] = assertTuple(numbers, 2);
				return [address, value];
			} catch (_) {
				// Nicer error message than assertTuple.
				throw new Error(
					"Lines must have exactly one address and one value, separated with a space."
				);
			}
		});
	} catch (e) {
		return undefined;
	}
}

function formatViceMonitorPokes(manual: Patch): string {
	return manual
		.map(
			([address, value]) => `> ${address.toString(16)} ${value.toString(16)}`
		)
		.join("\n");
}
