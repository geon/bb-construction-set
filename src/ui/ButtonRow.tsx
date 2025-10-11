import styled, { css } from "styled-components";

export const ButtonRow = styled.div<{
	readonly $align?: "left" | "right";
}>`
	display: flex;
	justify-content: space-between;
	gap: 1em;
	flex-wrap: wrap;

	${({ $align }) =>
		!$align
			? ""
			: css`
					${(
						{
							left: "margin-right",
							right: "margin-left",
						} as const
					)[$align]}: auto;
			  `}
`;
