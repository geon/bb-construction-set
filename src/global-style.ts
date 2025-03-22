import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
	#root {
		width: 100%;
		height: 100%;
	}

	:root {
		font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
		line-height: 1.5;
		font-weight: 400;

		color-scheme: light dark;

		color: rgba(255, 255, 255, 0.87);
		background-color: #242424;
		@media (prefers-color-scheme: light) {
			color: #213547;
			background: #eee;
		}


		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	a {
		font-weight: 500;
		color: #646cff;
		text-decoration: inherit;
	}
	a:hover {
		color: #535bf2;
		@media (prefers-color-scheme: light) {
			color: #747bff;
		}
	}

	body {
		margin: 0;
		display: flex;
		min-width: 320px;
		min-height: 100vh;
	}

	h1 {
		font-size: 3.2em;
		line-height: 1.1;
	}

	button {
		border-radius: 8px;
		border: 1px solid transparent;
		padding: 0.6em 1.2em;
		font-size: 1em;
		font-weight: 500;
		font-family: inherit;

		background-color: #1a1a1a;
		@media (prefers-color-scheme: light) {
			background-color: #f9f9f9;
		}

		cursor: pointer;
		transition: border-color 0.25s;
	}
	button:hover {
		border-color: #646cff;
	}
	button:focus,
	button:focus-visible {
		outline: 4px auto -webkit-focus-ring-color;
	}
`;

export default GlobalStyle;
