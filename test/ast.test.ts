import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("AST-specific features", () => {
	describe("quoted string handling", () => {
		test("handles double-quoted package names", () => {
			const result = packmorph('npm install "my-package"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["my-package"]);
				expect(result.npm).toBe('npm install "my-package"');
				expect(result.pnpm).toBe('pnpm add "my-package"');
			}
		});

		test("handles single-quoted package names", () => {
			const result = packmorph("npm install 'my-package'");
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["my-package"]);
				expect(result.npm).toBe("npm install 'my-package'");
			}
		});

		test("handles quoted strings with spaces", () => {
			const result = packmorph('npm install "package with spaces"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["package with spaces"]);
			}
		});

		test("handles escaped quotes in strings", () => {
			const result = packmorph('npm install "package\\"name"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(['package"name']);
			}
		});

		test("handles multiple quoted packages", () => {
			const result = packmorph('npm install "package-one" "package-two"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["package-one", "package-two"]);
			}
		});

		test("handles mixed quoted and unquoted packages", () => {
			const result = packmorph('npm install react "package-name" vue');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["react", "package-name", "vue"]);
				expect(result.npm).toBe('npm install react "package-name" vue');
			}
		});
	});

	describe("exec commands with quoted arguments", () => {
		test("handles npx with quoted arguments", () => {
			const result = packmorph('npx prettier "src/**/*.ts"', {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				expect(result.meta.args).toEqual(["src/**/*.ts"]);
			}
		});

		test("handles multiple quoted arguments", () => {
			const result = packmorph('npx eslint "file one.js" "file two.js"', {
				parseExec: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "exec") {
				expect(result.meta.package).toBe("eslint");
				expect(result.meta.args).toEqual(["file one.js", "file two.js"]);
			}
		});
	});

	describe("create commands with quoted arguments", () => {
		test("handles quoted project names", () => {
			const result = packmorph('npm create vite "my project"', {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				expect(result.meta.template).toBe("vite");
				expect(result.meta.additionalArgs).toEqual(["my project"]);
			}
		});

		test("handles quoted template with spaces", () => {
			const result = packmorph('npm create "my-template" project', {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "create") {
				expect(result.meta.template).toBe("my-template");
				expect(result.meta.additionalArgs).toEqual(["project"]);
			}
		});
	});

	describe("run commands with quoted scripts", () => {
		test("handles quoted script names", () => {
			const result = packmorph('npm run "build:prod"', { parseRun: true });
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "run") {
				expect(result.meta.script).toBe("build:prod");
			}
		});

		test("handles quoted arguments to scripts", () => {
			const result = packmorph('npm run build "output dir"', {
				parseRun: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "run") {
				expect(result.meta.script).toBe("build");
				expect(result.meta.args).toEqual(["output dir"]);
			}
		});
	});

	describe("edge cases", () => {
		test("handles empty quoted strings", () => {
			const result = packmorph('npm install ""');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual([""]);
			}
		});

		test("handles quotes with special characters", () => {
			const result = packmorph('npm install "pkg@^1.0.0"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["pkg@^1.0.0"]);
			}
		});

		test("handles unclosed quotes gracefully", () => {
			const result = packmorph('npm install "unclosed');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				// Lexer reads until end of input when quote isn't closed
				expect(result.meta.packages).toEqual(["unclosed"]);
			}
		});

		test("handles adjacent quoted strings", () => {
			const result = packmorph('npm install "pkg""name"');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				// Two separate tokens that get parsed as arguments
				expect(result.meta.packages).toEqual(["pkg", "name"]);
			}
		});
	});

	describe("whitespace handling", () => {
		test("handles extra spaces between quoted strings", () => {
			const result = packmorph('npm install   "pkg1"   "pkg2"   ');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["pkg1", "pkg2"]);
			}
		});

		test("preserves spaces within quotes", () => {
			const result = packmorph('npm install "  spaced  "');
			expect(result.ok).toBe(true);
			if (result.ok && result.type === "install") {
				expect(result.meta.packages).toEqual(["  spaced  "]);
			}
		});
	});
});
