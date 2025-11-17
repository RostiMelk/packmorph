import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index.js";

describe("multi-line commands", () => {
	describe("basic multi-line parsing", () => {
		test("parses multiple install commands", () => {
			const result = packmorph(
				`
npm install react
npm install -D typescript
pnpm add vitest
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(3);
				expect(result.commands[0].original).toBe("npm install react");
				expect(result.commands[1].original).toBe("npm install -D typescript");
				expect(result.commands[2].original).toBe("pnpm add vitest");
			}
		});

		test("ignores empty lines", () => {
			const result = packmorph(
				`
npm install react

npm install -D typescript


pnpm add vitest
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(3);
			}
		});

		test("ignores comment lines", () => {
			const result = packmorph(
				`
# Install dependencies
npm install react
# Install dev dependencies
npm install -D typescript
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(2);
				expect(result.commands[0].original).toBe("npm install react");
				expect(result.commands[1].original).toBe("npm install -D typescript");
			}
		});

		test("ignores non-package-manager commands", () => {
			const result = packmorph(
				`
cd my-project
npm install react
mkdir src
npm install -D typescript
echo "Done"
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(2);
				expect(result.commands[0].original).toBe("npm install react");
				expect(result.commands[1].original).toBe("npm install -D typescript");
			}
		});
	});

	describe("real-world examples", () => {
		test("handles Astro + Sanity example", () => {
			const result = packmorph(
				`
# outside your studio directory
npm create astro@latest astro-hello-world -- --template with-tailwindcss --typescript strict --skip-houston --install --git
cd astro-hello-world
`,
				{ parseMultiLine: true, parseCreate: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(1);
				expect(result.commands[0].original).toContain(
					"npm create astro@latest",
				);
				const cmd = result.commands[0].result;
				if (cmd.ok) {
					expect(cmd.npm).toContain("npm create astro@latest");
					expect(cmd.pnpm).toContain("pnpm create astro@latest");
					expect(cmd.type).toBe("create");
				}
			}
		});

		test("handles multiple command types", () => {
			const result = packmorph(
				`
# your-project-folder/astro-hello-world
npx astro add @sanity/astro -y
npm install astro-portabletext
`,
				{ parseMultiLine: true, parseExec: true, parseInstall: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(2);

				// First command is exec
				expect(result.commands[0].original).toBe(
					"npx astro add @sanity/astro -y",
				);
				const exec = result.commands[0].result;
				if (exec.ok) {
					expect(exec.type).toBe("exec");
					expect(exec.npm).toBe("npx astro add @sanity/astro -y");
					expect(exec.pnpm).toBe("pnpm dlx astro add @sanity/astro -y");
				}

				// Second command is install
				expect(result.commands[1].original).toBe(
					"npm install astro-portabletext",
				);
				const install = result.commands[1].result;
				if (install.ok) {
					expect(install.type).toBe("install");
					expect(install.npm).toBe("npm install astro-portabletext");
					expect(install.pnpm).toBe("pnpm add astro-portabletext");
				}
			}
		});

		test("handles complex setup script", () => {
			const result = packmorph(
				`
# Setup new project
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
`,
				{
					parseMultiLine: true,
					parseCreate: true,
					parseInstall: true,
					parseExec: true,
					parseRun: true,
				},
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(5);

				const types = result.commands.map((cmd) =>
					cmd.result.ok ? cmd.result.type : null,
				);
				expect(types).toEqual(["create", "install", "install", "exec", "run"]);
			}
		});
	});

	describe("with different parsers enabled", () => {
		test("only parses install commands by default", () => {
			const result = packmorph(
				`
npm install react
npx prettier .
npm run dev
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				// Only install command should be parsed
				expect(result.commands).toHaveLength(1);
				expect(result.commands[0].original).toBe("npm install react");
			}
		});

		test("parses exec commands when enabled", () => {
			const result = packmorph(
				`
npm install react
npx prettier .
`,
				{ parseMultiLine: true, parseExec: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(2);
				expect(
					result.commands[0].result.ok && result.commands[0].result.type,
				).toBe("install");
				expect(
					result.commands[1].result.ok && result.commands[1].result.type,
				).toBe("exec");
			}
		});

		test("skips unsupported commands silently", () => {
			const result = packmorph(
				`
npm install react
npm update lodash
npm install -D typescript
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				// npm update is not supported, should be skipped
				expect(result.commands).toHaveLength(2);
				expect(result.commands[0].original).toBe("npm install react");
				expect(result.commands[1].original).toBe("npm install -D typescript");
			}
		});
	});

	describe("edge cases", () => {
		test("handles empty input", () => {
			const result = packmorph("", { parseMultiLine: true });

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(0);
			}
		});

		test("handles only comments", () => {
			const result = packmorph(
				`
# Comment 1
# Comment 2
# Comment 3
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(0);
			}
		});

		test("handles mixed line endings", () => {
			const result = packmorph(
				"npm install react\r\nnpm install -D typescript\npnpm add vitest",
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands.length).toBeGreaterThanOrEqual(2);
			}
		});

		test("handles inline comments (treats as invalid command)", () => {
			const result = packmorph(
				`
npm install react # Install React
npm install -D typescript
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				// The first line with inline comment should fail to parse
				// Only the second command should be parsed
				expect(result.commands.length).toBeGreaterThanOrEqual(1);
			}
		});

		test("preserves original command exactly", () => {
			const result = packmorph(
				`
npm install    react     lodash
`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok && "commands" in result) {
				expect(result.commands).toHaveLength(1);
				expect(result.commands[0].original).toBe(
					"npm install    react     lodash",
				);
			}
		});
	});

	describe("type safety", () => {
		test("returns MultiLineResult when parseMultiLine is true", () => {
			const result = packmorph("npm install react", {
				parseMultiLine: true,
			});

			// TypeScript should infer this correctly
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect("commands" in result).toBe(true);
			}
		});

		test("returns PackmorphResult when parseMultiLine is false", () => {
			const result = packmorph("npm install react", {
				parseMultiLine: false,
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect("npm" in result).toBe(true);
				expect("pnpm" in result).toBe(true);
				expect("yarn" in result).toBe(true);
				expect("bun" in result).toBe(true);
			}
		});
	});
});
