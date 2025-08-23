import { ReactNode, useState } from "react";
import styled from "styled-components";
import { Patch, patchFromSegment, SingleBytePatch } from "../../bb/prg/io";
import { assertTuple } from "../../bb/tuple";
import { FileInput } from "../FileInput";
import { sidSegmentLocation } from "../../bb/prg/data-locations";

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
			<FileInput
				accept={["sid"]}
				onChange={async (file: File): Promise<void> =>
					setManualPatch(
						patchFromSegment(
							sidSegmentLocation,
							parseSid(await file.arrayBuffer())
						)
					)
				}
			>
				Load sid-file
			</FileInput>
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
				return assertTuple(numbers, 2);
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
		.map((byte) => `> ${byte[0].toString(16)} ${byte[1].toString(16)}`)
		.join("\n");
}

function parseSid(buffer: ArrayBuffer): Uint8Array {
	const view = new DataView(buffer);

	// https://www.hvsc.c64.org/download/C64Music/DOCUMENTS/SID_file_format.txt
	const version = view.getUint16(
		4,
		// Sid headers are big endian!
		false
	);
	const headerLength = version === 1 ? 0x76 : 0x7c;

	// 2 bytes little endian address. The data section is basically a prg.
	const binaryStart = headerLength + 2;

	return new Uint8Array(buffer, binaryStart);
}
