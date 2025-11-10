import styled from "styled-components";
import { ButtonRow } from "./ButtonRow";

export const ButtonGroup = styled(ButtonRow)`
	gap: 2px;
	justify-content: initial;

	& > button:not(:first-child) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	& > button:not(:last-child) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
`;
