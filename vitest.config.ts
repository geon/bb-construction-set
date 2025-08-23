import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			reporter: ["text"],
			exclude: [
				//
				...coverageConfigDefaults.exclude,
				"src/ui",
			],
		},
	},
});
