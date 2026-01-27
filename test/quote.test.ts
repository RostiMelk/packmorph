import { describe, expect, it } from "bun:test";
import { packmorph } from "../src/index.js";

describe("Quote Preservation", () => {
	describe("Install Commands", () => {
		it("preserves double quotes when input had double quotes", () => {
			const result = packmorph('npm install "react"');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm install "react"');
			expect(result.pnpm).toBe('pnpm add "react"');
			expect(result.yarn).toBe('yarn add "react"');
			expect(result.bun).toBe('bun add "react"');
			expect(result.meta.packages).toEqual(["react"]);
		});

		it("preserves single quotes when input had single quotes", () => {
			const result = packmorph("npm install 'react'");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe("npm install 'react'");
			expect(result.pnpm).toBe("pnpm add 'react'");
			expect(result.yarn).toBe("yarn add 'react'");
			expect(result.bun).toBe("bun add 'react'");
			expect(result.meta.packages).toEqual(["react"]);
		});

		it("does not add quotes when input had no quotes", () => {
			const result = packmorph("npm install react");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe("npm install react");
			expect(result.pnpm).toBe("pnpm add react");
			expect(result.yarn).toBe("yarn add react");
			expect(result.bun).toBe("bun add react");
			expect(result.meta.packages).toEqual(["react"]);
		});

		it("preserves quotes for arguments with spaces", () => {
			const result = packmorph('npm install "package name"');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm install "package name"');
			expect(result.pnpm).toBe('pnpm add "package name"');
			expect(result.yarn).toBe('yarn add "package name"');
			expect(result.bun).toBe('bun add "package name"');
			expect(result.meta.packages).toEqual(["package name"]);
		});

		it("does NOT auto-quote unquoted arguments with spaces (intentionally broken)", () => {
			const result = packmorph("npm install package name");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			// This is intentionally "broken" - we preserve the user's mistake
			expect(result.npm).toBe("npm install package name");
			expect(result.pnpm).toBe("pnpm add package name");
			expect(result.yarn).toBe("yarn add package name");
			expect(result.bun).toBe("bun add package name");
			// The lexer treats this as two separate packages
			expect(result.meta.packages).toEqual(["package", "name"]);
		});

		it("preserves escaped quotes", () => {
			const result = packmorph('npm install "some\\"thing"');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm install "some\\"thing"');
			expect(result.pnpm).toBe('pnpm add "some\\"thing"');
			expect(result.yarn).toBe('yarn add "some\\"thing"');
			expect(result.bun).toBe('bun add "some\\"thing"');
			expect(result.meta.packages).toEqual(['some"thing']);
		});

		it("preserves empty quoted strings", () => {
			const result = packmorph('npm install ""');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm install ""');
			expect(result.pnpm).toBe('pnpm add ""');
			expect(result.yarn).toBe('yarn add ""');
			expect(result.bun).toBe('bun add ""');
			expect(result.meta.packages).toEqual([""]);
		});

		it("handles mixed quoted and unquoted packages", () => {
			const result = packmorph('npm install react "vue" svelte');
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm install react "vue" svelte');
			expect(result.pnpm).toBe('pnpm add react "vue" svelte');
			expect(result.yarn).toBe('yarn add react "vue" svelte');
			expect(result.bun).toBe('bun add react "vue" svelte');
			expect(result.meta.packages).toEqual(["react", "vue", "svelte"]);
		});
	});

	describe("Exec Commands", () => {
		it("preserves quotes in exec commands", () => {
			const result = packmorph(
				'pnpm dlx create-next-app --import-alias "@/*"',
				{
					parseExec: true,
				},
			);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npx create-next-app --import-alias "@/*"');
			expect(result.pnpm).toBe('pnpm dlx create-next-app --import-alias "@/*"');
			expect(result.yarn).toBe('yarn dlx create-next-app --import-alias "@/*"');
			expect(result.bun).toBe('bunx create-next-app --import-alias "@/*"');
			expect(result.meta.package).toBe("create-next-app");
			expect(result.meta.args).toEqual(["--import-alias", "@/*"]);
		});

		it("preserves quotes with single quotes in exec", () => {
			const result = packmorph("npx prettier --write '*.ts'", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe("npx prettier --write '*.ts'");
			expect(result.pnpm).toBe("pnpm dlx prettier --write '*.ts'");
			expect(result.yarn).toBe("yarn dlx prettier --write '*.ts'");
			expect(result.bun).toBe("bunx prettier --write '*.ts'");
			expect(result.meta.package).toBe("prettier");
			expect(result.meta.args).toEqual(["--write", "*.ts"]);
		});
	});

	describe("Run Commands", () => {
		it("preserves quotes in run commands", () => {
			const result = packmorph('npm run "test:unit"', { parseRun: true });
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm run "test:unit"');
			expect(result.pnpm).toBe('pnpm run "test:unit"');
			expect(result.yarn).toBe('yarn run "test:unit"');
			expect(result.bun).toBe('bun run "test:unit"');
			expect(result.meta.script).toBe("test:unit");
		});

		it("preserves quotes in run command arguments", () => {
			const result = packmorph('npm run build --output="dist/main"', {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe('npm run build --output="dist/main"');
			expect(result.pnpm).toBe('pnpm run build --output="dist/main"');
			expect(result.yarn).toBe('yarn run build --output="dist/main"');
			expect(result.bun).toBe('bun run build --output="dist/main"');
			expect(result.meta.script).toBe("build");
			expect(result.meta.args).toEqual(['--output="dist/main"']);
		});
	});

	describe("Create Commands", () => {
		it("preserves quotes in create commands", () => {
			const result = packmorph(
				'npm create vite@latest my-app -- --template "react-ts"',
				{ parseCreate: true },
			);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.npm).toBe(
				'npm create vite@latest -- my-app --template "react-ts"',
			);
			expect(result.pnpm).toBe(
				'pnpm create vite@latest my-app --template "react-ts"',
			);
			expect(result.yarn).toBe(
				'yarn create vite@latest my-app --template "react-ts"',
			);
			expect(result.bun).toBe(
				'bun create vite@latest my-app --template "react-ts"',
			);
			expect(result.meta.template).toBe("vite@latest");
			expect(result.meta.additionalArgs).toEqual([
				"my-app",
				"--template",
				"react-ts",
			]);
		});
	});
});
