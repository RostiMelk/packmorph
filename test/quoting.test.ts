import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index.js";

describe("Quote preservation", () => {
	describe("create commands with quoted arguments (reported issue)", () => {
		test("preserves quotes for create command with spaces in arguments", () => {
			const result = packmorph(
				'pnpm create sanity@latest --create-project "Day One Content Operations"',
				{ parseCreate: true },
			);
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				// The output commands should preserve quotes for arguments with spaces
				expect(result.pnpm).toBe(
					'pnpm create sanity@latest --create-project "Day One Content Operations"',
				);
				expect(result.npm).toBe(
					'npm create sanity@latest -- --create-project "Day One Content Operations"',
				);
				expect(result.yarn).toBe(
					'yarn create sanity@latest --create-project "Day One Content Operations"',
				);
				expect(result.bun).toBe(
					'bun create sanity@latest --create-project "Day One Content Operations"',
				);
				// Meta should contain unquoted values for programmatic use
				expect(result.meta.additionalArgs).toEqual([
					"--create-project",
					"Day One Content Operations",
				]);
			}
		});

		test("preserves quotes for multiple quoted arguments", () => {
			const result = packmorph(
				'npm create vite "my project" --template "react app"',
				{ parseCreate: true },
			);
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				expect(result.npm).toBe(
					'npm create vite -- "my project" --template "react app"',
				);
				expect(result.pnpm).toBe(
					'pnpm create vite "my project" --template "react app"',
				);
			}
		});

		test("preserves single quotes", () => {
			const result = packmorph("pnpm create next 'my app name'", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				expect(result.pnpm).toBe("pnpm create next 'my app name'");
				expect(result.npm).toBe("npm create next -- 'my app name'");
			}
		});

		test("does not quote arguments that don't need quoting", () => {
			const result = packmorph("npm create vite my-app --template react", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				expect(result.npm).toBe("npm create vite -- my-app --template react");
				expect(result.pnpm).toBe("pnpm create vite my-app --template react");
			}
		});
	});

	describe("exec commands with quoted arguments", () => {
		test("preserves quotes for paths with spaces", () => {
			const result = packmorph('bunx eslint "path/to/my file.js"', {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				expect(result.bun).toBe('bunx eslint "path/to/my file.js"');
			}
		});

		test("auto-quotes arguments with special shell characters", () => {
			const result = packmorph("npx command arg$with$dollar", {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				// Should auto-quote because of $ character
				expect(result.npm).toBe('npx command "arg$with$dollar"');
			}
		});

		test("handles quoted glob patterns", () => {
			const result = packmorph('npx prettier "src/**/*.ts"', {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				// Glob patterns don't strictly need quoting for parsing,
				// so quotes are not preserved if the pattern doesn't match needsQuoting regex
				expect(result.meta.args).toEqual(["src/**/*.ts"]);
			}
		});
	});

	describe("run commands with quoted arguments", () => {
		test("preserves quotes for script arguments with spaces", () => {
			const result = packmorph('npm run build "output directory"', {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "run") {
				expect(result.npm).toBe('npm run build "output directory"');
				expect(result.pnpm).toBe('pnpm run build "output directory"');
			}
		});

		test("preserves quotes for script names with spaces", () => {
			const result = packmorph('yarn run "build:all targets"', {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "run") {
				expect(result.yarn).toBe('yarn run "build:all targets"');
			}
		});
	});

	describe("install commands with quoted packages", () => {
		test("preserves quotes for package names with spaces", () => {
			const result = packmorph('npm install "package with spaces"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.npm).toBe('npm install "package with spaces"');
				expect(result.pnpm).toBe('pnpm add "package with spaces"');
			}
		});

		test("does not quote normal package names", () => {
			const result = packmorph('npm install "react"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				// "react" was quoted but doesn't need to be
				expect(result.npm).toBe("npm install react");
				expect(result.pnpm).toBe("pnpm add react");
			}
		});

		test("auto-quotes package names with special characters", () => {
			const result = packmorph("npm install package&name");
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				// Should auto-quote because of & character
				expect(result.npm).toBe('npm install "package&name"');
			}
		});
	});

	describe("special characters requiring quotes", () => {
		test("auto-quotes arguments with spaces", () => {
			const result = packmorph("npm create vite my new app", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				// These are parsed as separate arguments but we test the function behavior
				expect(result.meta.additionalArgs).toEqual(["my", "new", "app"]);
			}
		});

		test("preserves quotes for arguments with dollar sign", () => {
			const result = packmorph('npx cmd "arg$with$dollar"', {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				expect(result.npm).toBe('npx cmd "arg$with$dollar"');
			}
		});
	});

	describe("quote escaping", () => {
		test("preserves escaped quotes within quoted strings", () => {
			const result = packmorph('npm install "pkg\\"name"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(['pkg"name']);
				// Should re-escape the quote
				expect(result.npm).toBe('npm install "pkg\\"name"');
			}
		});

		test("handles escaped quotes in arguments", () => {
			const result = packmorph('npx cmd "arg with \\"quotes\\""', {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				expect(result.meta.args).toEqual(['arg with "quotes"']);
				expect(result.npm).toBe('npx cmd "arg with \\"quotes\\""');
			}
		});
	});

	describe("empty strings", () => {
		test("preserves empty quoted strings", () => {
			const result = packmorph('npm install ""');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual([""]);
				expect(result.npm).toBe('npm install ""');
			}
		});
	});

	describe("mixed quoted and unquoted", () => {
		test("handles mixed quoted and unquoted arguments", () => {
			const result = packmorph('npm create vite my-app --template "react ts"', {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				expect(result.npm).toBe(
					'npm create vite -- my-app --template "react ts"',
				);
				expect(result.pnpm).toBe(
					'pnpm create vite my-app --template "react ts"',
				);
			}
		});

		test("handles multiple quoted and unquoted packages", () => {
			const result = packmorph('npm install react "package name" vue');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.npm).toBe('npm install react "package name" vue');
			}
		});
	});
});
