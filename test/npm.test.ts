import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("npm commands", () => {
	describe("basic commands", () => {
		test("simple npm install with single package", () => {
			const result = packmorph("npm install react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react");
				expect(result.pnpm).toBe("pnpm add react");
				expect(result.yarn).toBe("yarn add react");
				expect(result.bun).toBe("bun add react");
				expect(result.meta.manager).toBe("npm");
				expect(result.meta.packages).toEqual(["react"]);
				expect(result.meta.dev).toBe(false);
				expect(result.meta.global).toBe(false);
				expect(result.meta.exact).toBe(false);
			}
		});

		test("npm i shorthand with single package", () => {
			const result = packmorph("npm i react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react");
				expect(result.pnpm).toBe("pnpm add react");
				expect(result.yarn).toBe("yarn add react");
				expect(result.bun).toBe("bun add react");
			}
		});

		test("npm install with multiple packages", () => {
			const result = packmorph("npm install react react-dom");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react react-dom");
				expect(result.pnpm).toBe("pnpm add react react-dom");
				expect(result.yarn).toBe("yarn add react react-dom");
				expect(result.bun).toBe("bun add react react-dom");
				expect(result.meta.packages).toEqual(["react", "react-dom"]);
			}
		});

		test("npm install with no packages (from package.json)", () => {
			const result = packmorph("npm install");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install");
				expect(result.pnpm).toBe("pnpm install");
				expect(result.yarn).toBe("yarn install");
				expect(result.bun).toBe("bun install");
				expect(result.meta.packages).toEqual([]);
			}
		});

		test("npm i with no packages", () => {
			const result = packmorph("npm i");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install");
				expect(result.pnpm).toBe("pnpm install");
				expect(result.yarn).toBe("yarn install");
				expect(result.bun).toBe("bun install");
			}
		});
	});

	describe("flags", () => {
		test("npm install -D (dev dependency short flag)", () => {
			const result = packmorph("npm install -D typescript");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -D typescript");
				expect(result.pnpm).toBe("pnpm add -D typescript");
				expect(result.yarn).toBe("yarn add --dev typescript");
				expect(result.bun).toBe("bun add --dev typescript");
				expect(result.meta.dev).toBe(true);
			}
		});

		test("npm i -D (short command with dev flag)", () => {
			const result = packmorph("npm i -D typescript");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -D typescript");
				expect(result.pnpm).toBe("pnpm add -D typescript");
				expect(result.yarn).toBe("yarn add --dev typescript");
				expect(result.bun).toBe("bun add --dev typescript");
				expect(result.meta.dev).toBe(true);
			}
		});

		test("npm install --save-dev (dev dependency long flag)", () => {
			const result = packmorph("npm install --save-dev vitest");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --save-dev vitest");
				expect(result.pnpm).toBe("pnpm add --save-dev vitest");
				expect(result.yarn).toBe("yarn add --dev vitest");
				expect(result.bun).toBe("bun add --dev vitest");
				expect(result.meta.dev).toBe(true);
			}
		});

		test("npm install -D with multiple packages", () => {
			const result = packmorph("npm install -D vitest @types/node");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -D vitest @types/node");
				expect(result.pnpm).toBe("pnpm add -D vitest @types/node");
				expect(result.yarn).toBe("yarn add --dev vitest @types/node");
				expect(result.bun).toBe("bun add --dev vitest @types/node");
				expect(result.meta.packages).toEqual(["vitest", "@types/node"]);
			}
		});

		test("npm install -g (global)", () => {
			const result = packmorph("npm install -g eslint");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -g eslint");
				expect(result.pnpm).toBe("pnpm add -g eslint");
				expect(result.yarn).toBe("yarn global add eslint");
				expect(result.bun).toBe("bun add -g eslint");
				expect(result.meta.global).toBe(true);
			}
		});

		test("npm install --global", () => {
			const result = packmorph("npm install --global eslint");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --global eslint");
				expect(result.pnpm).toBe("pnpm add --global eslint");
				expect(result.yarn).toBe("yarn global add eslint");
				expect(result.bun).toBe("bun add -g eslint");
				expect(result.meta.global).toBe(true);
			}
		});

		test("npm install -E (exact)", () => {
			const result = packmorph("npm install -E react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -E react");
				expect(result.pnpm).toBe("pnpm add -E react");
				expect(result.yarn).toBe("yarn add --exact react");
				expect(result.bun).toBe("bun add --exact react");
				expect(result.meta.exact).toBe(true);
			}
		});

		test("npm install --save-exact", () => {
			const result = packmorph("npm install --save-exact react@18.2.0");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --save-exact react@18.2.0");
				expect(result.pnpm).toBe("pnpm add --save-exact react@18.2.0");
				expect(result.yarn).toBe("yarn add --exact react@18.2.0");
				expect(result.bun).toBe("bun add --exact react@18.2.0");
				expect(result.meta.packages).toEqual(["react@18.2.0"]);
			}
		});

		test("npm install -O (optional)", () => {
			const result = packmorph("npm install -O some-package");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -O some-package");
				expect(result.pnpm).toBe("pnpm add -O some-package");
				expect(result.yarn).toBe("yarn add some-package");
				expect(result.bun).toBe("bun add some-package");
				expect(result.meta.optional).toBe(true);
			}
		});

		test("npm install --save-optional", () => {
			const result = packmorph("npm install --save-optional some-package");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --save-optional some-package");
				expect(result.pnpm).toBe("pnpm add --save-optional some-package");
				expect(result.meta.optional).toBe(true);
			}
		});

		test("npm install -P (peer)", () => {
			const result = packmorph("npm install -P some-package");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install -P some-package");
				expect(result.pnpm).toBe("pnpm add -P some-package");
				expect(result.yarn).toBe("yarn add some-package");
				expect(result.bun).toBe("bun add some-package");
				expect(result.meta.peer).toBe(true);
			}
		});

		test("npm install --save-peer", () => {
			const result = packmorph("npm install --save-peer some-package");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --save-peer some-package");
				expect(result.pnpm).toBe("pnpm add --save-peer some-package");
				expect(result.meta.peer).toBe(true);
			}
		});

		test("npm install --frozen-lockfile", () => {
			const result = packmorph("npm install --frozen-lockfile");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --frozen-lockfile");
				expect(result.pnpm).toBe("pnpm install --frozen-lockfile");
				expect(result.yarn).toBe("yarn install --frozen-lockfile");
				expect(result.bun).toBe("bun install");
				expect(result.meta.frozen).toBe(true);
			}
		});

		test("npm install with frozen-lockfile and packages", () => {
			const result = packmorph("npm install --frozen-lockfile react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --frozen-lockfile react");
				expect(result.pnpm).toBe("pnpm add --frozen-lockfile react");
				expect(result.yarn).toBe("yarn add react");
				expect(result.bun).toBe("bun add react");
			}
		});

		test("npm install with multiple flags", () => {
			const result = packmorph("npm install -D -E typescript");
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

		test("npm install with redundant flags", () => {
			const result = packmorph("npm install -D --save-dev react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.dev).toBe(true);
			}
		});

		test("npm install with unknown flags", () => {
			const result = packmorph("npm install --some-unknown-flag react");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install --some-unknown-flag react");
				expect(result.pnpm).toBe("pnpm add --some-unknown-flag react");
				expect(result.yarn).toBe("yarn add react");
				expect(result.bun).toBe("bun add react");
				expect(result.meta.unknownFlags).toEqual(["--some-unknown-flag"]);
			}
		});
	});
});
