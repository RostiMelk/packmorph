import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index.js";

describe("run commands", () => {
	describe("npm run", () => {
		test("basic npm run command", () => {
			const result = packmorph("npm run dev", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run dev");
				expect(result.pnpm).toBe("pnpm run dev");
				expect(result.yarn).toBe("yarn run dev");
				expect(result.bun).toBe("bun run dev");
				expect(result.meta.type).toBe("run");
				expect(result.meta.manager).toBe("npm");
				expect(result.meta.script).toBe("dev");
				expect(result.meta.args).toEqual([]);
			}
		});

		test("npm run with arguments", () => {
			const result = packmorph("npm run build --production", {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run build --production");
				expect(result.pnpm).toBe("pnpm run build --production");
				expect(result.yarn).toBe("yarn run build --production");
				expect(result.bun).toBe("bun run build --production");
				expect(result.meta.script).toBe("build");
				expect(result.meta.args).toEqual(["--production"]);
			}
		});

		test("npm run with multiple arguments", () => {
			const result = packmorph("npm run test --watch --coverage", {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run test --watch --coverage");
				expect(result.pnpm).toBe("pnpm run test --watch --coverage");
				expect(result.yarn).toBe("yarn run test --watch --coverage");
				expect(result.bun).toBe("bun run test --watch --coverage");
				expect(result.meta.args).toEqual(["--watch", "--coverage"]);
			}
		});

		test("npm run with script containing dash", () => {
			const result = packmorph("npm run build-production", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.script).toBe("build-production");
			}
		});

		test("npm run with script containing colon", () => {
			const result = packmorph("npm run test:unit", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.script).toBe("test:unit");
			}
		});
	});

	describe("pnpm run", () => {
		test("basic pnpm run command", () => {
			const result = packmorph("pnpm run start", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run start");
				expect(result.pnpm).toBe("pnpm run start");
				expect(result.yarn).toBe("yarn run start");
				expect(result.bun).toBe("bun run start");
				expect(result.meta.type).toBe("run");
				expect(result.meta.manager).toBe("pnpm");
				expect(result.meta.script).toBe("start");
			}
		});

		test("pnpm run with arguments", () => {
			const result = packmorph("pnpm run lint --fix", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run lint --fix");
				expect(result.pnpm).toBe("pnpm run lint --fix");
				expect(result.yarn).toBe("yarn run lint --fix");
				expect(result.bun).toBe("bun run lint --fix");
				expect(result.meta.args).toEqual(["--fix"]);
			}
		});
	});

	describe("yarn run", () => {
		test("basic yarn run command", () => {
			const result = packmorph("yarn run test", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run test");
				expect(result.pnpm).toBe("pnpm run test");
				expect(result.yarn).toBe("yarn run test");
				expect(result.bun).toBe("bun run test");
				expect(result.meta.type).toBe("run");
				expect(result.meta.manager).toBe("yarn");
				expect(result.meta.script).toBe("test");
			}
		});

		test("yarn run with arguments", () => {
			const result = packmorph("yarn run format --check", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run format --check");
				expect(result.pnpm).toBe("pnpm run format --check");
				expect(result.yarn).toBe("yarn run format --check");
				expect(result.bun).toBe("bun run format --check");
				expect(result.meta.args).toEqual(["--check"]);
			}
		});
	});

	describe("bun run", () => {
		test("basic bun run command", () => {
			const result = packmorph("bun run build", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run build");
				expect(result.pnpm).toBe("pnpm run build");
				expect(result.yarn).toBe("yarn run build");
				expect(result.bun).toBe("bun run build");
				expect(result.meta.type).toBe("run");
				expect(result.meta.manager).toBe("bun");
				expect(result.meta.script).toBe("build");
			}
		});

		test("bun run with arguments", () => {
			const result = packmorph("bun run typecheck --strict", {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm run typecheck --strict");
				expect(result.pnpm).toBe("pnpm run typecheck --strict");
				expect(result.yarn).toBe("yarn run typecheck --strict");
				expect(result.bun).toBe("bun run typecheck --strict");
				expect(result.meta.args).toEqual(["--strict"]);
			}
		});
	});

	describe("error cases", () => {
		test("rejects run commands when parseRun is false", () => {
			const result = packmorph("npm run dev");
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-install-command");
			}
		});

		test("rejects npm run without script name", () => {
			const result = packmorph("npm run", { parseRun: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects pnpm run without script name", () => {
			const result = packmorph("pnpm run", { parseRun: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects yarn run without script name", () => {
			const result = packmorph("yarn run", { parseRun: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects bun run without script name", () => {
			const result = packmorph("bun run", { parseRun: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects invalid package manager", () => {
			const result = packmorph("cargo run build", { parseRun: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-supported-command");
			}
		});
	});

	describe("edge cases", () => {
		test("handles extra whitespace", () => {
			const result = packmorph("npm  run   dev", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.script).toBe("dev");
			}
		});

		test("handles script with numeric characters", () => {
			const result = packmorph("npm run test123", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.script).toBe("test123");
			}
		});

		test("handles script starting with number", () => {
			const result = packmorph("npm run 2build", { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.script).toBe("2build");
			}
		});
	});
});
