import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import GlobalStyle from "./global-style.ts";

ReactDOM.createRoot(document.getElementsByTagName("body")[0]!).render(
	<React.StrictMode>
		<GlobalStyle />
		<App />
	</React.StrictMode>
);
