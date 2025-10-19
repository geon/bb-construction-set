import styled, { css } from "styled-components";
import { colors } from "./global-style";

export const RadioButton = styled.button<{ readonly $active?: boolean }>`
	${({ $active }) =>
		!$active
			? ""
			: css`
					border-color: ${colors.active};
					&:focus {
						outline-color: ${colors.active};
					}
			  `}
`;
