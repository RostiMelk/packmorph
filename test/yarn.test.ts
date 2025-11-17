import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("yarn commands", () => {
	describe("basic commands", () => {
		test("yarn add single package", () => {
			const result = packmorph("yarn add react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react");
				expect(result.pnpm).toBe("pnpm add react");
				expect(result.yarn).toBe("yarn add react");
				expect(result.bun).toBe("bun add react");
				expect(result.meta.manager).toBe("yarn");
				expect(result.meta.packages).toEqual(["react"]);
			}
		});

		test("yarn add multiple packages", () => {
			const result = packmorph("yarn add react react-dom");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react react-dom");
				expect(result.pnpm).toBe("pnpm add react react-dom");
				expect(result.yarn).toBe("yarn add react react-dom");
				expect(result.bun).toBe("bun add react react-dom");
				expect(result.meta.packages).toEqual(["react", "react-dom"]);
			}
		});

		test("yarn install (no packages)", () => {
			const result = packmorph("yarn install");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install");
				expect(result.pnpm).toBe("pnpm install");
				expect(result.yarn).toBe("yarn install");
				expect(result.bun).toBe("bun install");
				expect(result.meta.packages).toEqual([]);
			}
		});
	});

	describe("flags", () => {
		test("yarn add --dev", () => {
			const result = packmorph("yarn add --dev typescript");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -D typescript");
				expect(result.pnpm).toBe("pnpm add -D typescript");
				expect(result.yarn).toBe("yarn add --dev typescript");
				expect(result.bun).toBe("bun add --dev typescript");
				expect(result.meta.dev).toBe(true);
			}
		});

		test("yarn add -D", () => {
			const result = packmorph("yarn add -D typescript");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -D typescript");
				expect(result.pnpm).toBe("pnpm add -D typescript");
				expect(result.yarn).toBe("yarn add --dev typescript");
				expect(result.bun).toBe("bun add --dev typescript");
				expect(result.meta.dev).toBe(true);
			}
		});

		test("yarn global add", () => {
			const result = packmorph("yarn global add eslint");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -g eslint");
				expect(result.pnpm).toBe("pnpm add -g eslint");
				expect(result.yarn).toBe("yarn global add eslint");
				expect(result.bun).toBe("bun add -g eslint");
				expect(result.meta.global).toBe(true);
			}
		});

		test("yarn add --exact", () => {
			const result = packmorph("yarn add --exact react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -E react");
				expect(result.pnpm).toBe("pnpm add -E react");
				expect(result.yarn).toBe("yarn add --exact react");
				expect(result.bun).toBe("bun add --exact react");
				expect(result.meta.exact).toBe(true);
			}
		});

		test("yarn add -E", () => {
			const result = packmorph("yarn add -E react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -E react");
				expect(result.pnpm).toBe("pnpm add -E react");
				expect(result.yarn).toBe("yarn add --exact react");
				expect(result.bun).toBe("bun add --exact react");
				expect(result.meta.exact).toBe(true);
			}
		});

		test("yarn add with multiple flags", () => {
			const result = packmorph("yarn add --dev --exact typescript");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -D -E typescript");
				expect(result.pnpm).toBe("pnpm add -D -E typescript");
				expect(result.yarn).toBe("yarn add --dev --exact typescript");
				expect(result.bun).toBe("bun add --dev --exact typescript");
				expect(result.meta.dev).toBe(true);
				expect(result.meta.exact).toBe(true);
			}
		});

		test("yarn install --frozen-lockfile", () => {
			const result = packmorph("yarn install --frozen-lockfile");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --frozen-lockfile");
				expect(result.pnpm).toBe("pnpm install --frozen-lockfile");
				expect(result.yarn).toBe("yarn install --frozen-lockfile");
				expect(result.bun).toBe("bun install");
				expect(result.meta.frozen).toBe(true);
			}
		});
	});
});
