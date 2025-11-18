import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index.js";

describe("exec commands", () => {
	describe("npx", () => {
		test("basic npx command", () => {
			const result = packmorph("npx eslint .", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx eslint .");
				expect(result.pnpm).toBe("pnpm dlx eslint .");
				expect(result.yarn).toBe("yarn dlx eslint .");
				expect(result.bun).toBe("bunx eslint .");
				expect(result.meta.type).toBe("exec");
				expect(result.meta.manager).toBe("npm");
				expect(result.meta.package).toBe("eslint");
				expect(result.meta.args).toEqual(["."]);
			}
		});

		test("npx with multiple arguments", () => {
			const result = packmorph("npx prettier --write src/**/*.ts", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx prettier --write src/**/*.ts");
				expect(result.pnpm).toBe("pnpm dlx prettier --write src/**/*.ts");
				expect(result.yarn).toBe("yarn dlx prettier --write src/**/*.ts");
				expect(result.bun).toBe("bunx prettier --write src/**/*.ts");
				expect(result.meta.args).toEqual(["--write", "src/**/*.ts"]);
			}
		});

		test("npx with flags before package", () => {
			const result = packmorph("npx --yes create-react-app my-app", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx --yes create-react-app my-app");
				expect(result.pnpm).toBe("pnpm dlx --yes create-react-app my-app");
				expect(result.yarn).toBe("yarn dlx --yes create-react-app my-app");
				expect(result.bun).toBe("bunx --yes create-react-app my-app");
				expect(result.meta.flags).toEqual(["--yes"]);
				expect(result.meta.package).toBe("create-react-app");
				expect(result.meta.args).toEqual(["my-app"]);
			}
		});

		test("npx with scoped package", () => {
			const result = packmorph("npx @biomejs/biome check", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx @biomejs/biome check");
				expect(result.pnpm).toBe("pnpm dlx @biomejs/biome check");
				expect(result.yarn).toBe("yarn dlx @biomejs/biome check");
				expect(result.bun).toBe("bunx @biomejs/biome check");
				expect(result.meta.package).toBe("@biomejs/biome");
			}
		});
	});

	describe("pnpm dlx", () => {
		test("basic pnpm dlx command", () => {
			const result = packmorph("pnpm dlx prettier .", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx prettier .");
				expect(result.pnpm).toBe("pnpm dlx prettier .");
				expect(result.yarn).toBe("yarn dlx prettier .");
				expect(result.bun).toBe("bunx prettier .");
				expect(result.meta.type).toBe("exec");
				expect(result.meta.manager).toBe("pnpm");
				expect(result.meta.package).toBe("prettier");
			}
		});

		test("pnpm dlx with arguments", () => {
			const result = packmorph("pnpm dlx tsc --noEmit", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx tsc --noEmit");
				expect(result.pnpm).toBe("pnpm dlx tsc --noEmit");
				expect(result.yarn).toBe("yarn dlx tsc --noEmit");
				expect(result.bun).toBe("bunx tsc --noEmit");
				expect(result.meta.args).toEqual(["--noEmit"]);
			}
		});

		test("pnpm dlx with flags", () => {
			const result = packmorph("pnpm dlx --package=typescript tsc --version", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.flags).toEqual(["--package=typescript"]);
			}
		});
	});

	describe("yarn dlx", () => {
		test("basic yarn dlx command", () => {
			const result = packmorph("yarn dlx eslint src", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx eslint src");
				expect(result.pnpm).toBe("pnpm dlx eslint src");
				expect(result.yarn).toBe("yarn dlx eslint src");
				expect(result.bun).toBe("bunx eslint src");
				expect(result.meta.type).toBe("exec");
				expect(result.meta.manager).toBe("yarn");
				expect(result.meta.package).toBe("eslint");
			}
		});

		test("yarn dlx with multiple arguments", () => {
			const result = packmorph("yarn dlx create-next-app@latest my-app", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx create-next-app@latest my-app");
				expect(result.pnpm).toBe("pnpm dlx create-next-app@latest my-app");
				expect(result.yarn).toBe("yarn dlx create-next-app@latest my-app");
				expect(result.bun).toBe("bunx create-next-app@latest my-app");
				expect(result.meta.package).toBe("create-next-app@latest");
				expect(result.meta.args).toEqual(["my-app"]);
			}
		});
	});

	describe("bunx", () => {
		test("basic bunx command", () => {
			const result = packmorph("bunx vitest", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx vitest");
				expect(result.pnpm).toBe("pnpm dlx vitest");
				expect(result.yarn).toBe("yarn dlx vitest");
				expect(result.bun).toBe("bunx vitest");
				expect(result.meta.type).toBe("exec");
				expect(result.meta.manager).toBe("bun");
				expect(result.meta.package).toBe("vitest");
			}
		});

		test("bunx with arguments", () => {
			const result = packmorph("bunx tsc --init", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npx tsc --init");
				expect(result.pnpm).toBe("pnpm dlx tsc --init");
				expect(result.yarn).toBe("yarn dlx tsc --init");
				expect(result.bun).toBe("bunx tsc --init");
				expect(result.meta.args).toEqual(["--init"]);
			}
		});

		test("bunx with flags and arguments", () => {
			const result = packmorph("bunx --bun vite build", { parseExec: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.flags).toEqual(["--bun"]);
				expect(result.meta.package).toBe("vite");
				expect(result.meta.args).toEqual(["build"]);
			}
		});
	});

	describe("error cases", () => {
		test("rejects exec commands when parseExec is false", () => {
			const result = packmorph("npx eslint .");
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-supported-command");
			}
		});

		test("rejects exec command without package name", () => {
			const result = packmorph("npx", { parseExec: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects pnpm dlx without package name", () => {
			const result = packmorph("pnpm dlx", { parseExec: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects yarn dlx without package name", () => {
			const result = packmorph("yarn dlx", { parseExec: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects bunx without package name", () => {
			const result = packmorph("bunx", { parseExec: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects exec command with only flags", () => {
			const result = packmorph("npx --yes", { parseExec: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});
	});
});
