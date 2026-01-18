import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App.tsx";
import GlobalStyle from "./ui/global-style.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<GlobalStyle />
		<App />
	</React.StrictMode>,
);
