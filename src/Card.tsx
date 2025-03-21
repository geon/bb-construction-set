import styled from "styled-components";

export const Card = styled.div`
	background: hsl(0deg 0% 17%);
	@media (prefers-color-scheme: light) {
		background: white;
	}

	box-shadow: 0px 2px 5px #00000066;
	border-radius: 5px;

	padding: 1em;
`;
