import { describe, expect, test } from "bun:test";
import outdent from "outdent";
import { packmorph } from "../src/index.js";

describe("multi-line commands", () => {
	describe("basic multi-line parsing", () => {
		test("parses multiple install commands from same package manager", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          npm install -D typescript
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react\nnpm install -D typescript");
				expect(result.pnpm).toBe("pnpm add react\npnpm add -D typescript");
				expect(result.yarn).toBe("yarn add react\nyarn add --dev typescript");
				expect(result.bun).toBe("bun add react\nbun add --dev typescript");
			}
		});

		test("ignores empty lines", () => {
			const result = packmorph(
				outdent`
		          npm install react

		          npm install -D typescript


		          npm install vitest
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm install react\n\nnpm install -D typescript\n\n\nnpm install vitest",
				);
				expect(result.pnpm).toBe(
					"pnpm add react\n\npnpm add -D typescript\n\n\npnpm add vitest",
				);
			}
		});

		test("preserves comment lines", () => {
			const result = packmorph(
				outdent`
		          # Install dependencies
		          npm install react
		          # Install dev dependencies
		          npm install -D typescript
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"# Install dependencies\nnpm install react\n# Install dev dependencies\nnpm install -D typescript",
				);
				expect(result.pnpm).toBe(
					"# Install dependencies\npnpm add react\n# Install dev dependencies\npnpm add -D typescript",
				);
			}
		});

		test("preserves non-package-manager commands", () => {
			const result = packmorph(
				outdent`
		          cd my-project
		          npm install react
		          mkdir src
		          npm install -D typescript
		          echo "Done"
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					'cd my-project\nnpm install react\nmkdir src\nnpm install -D typescript\necho "Done"',
				);
				expect(result.pnpm).toBe(
					'cd my-project\npnpm add react\nmkdir src\npnpm add -D typescript\necho "Done"',
				);
			}
		});
	});

	describe("real-world examples", () => {
		test("handles Astro + Sanity example", () => {
			const result = packmorph(
				outdent`
		          # outside your studio directory
		          npm create astro@latest astro-hello-world -- --template with-tailwindcss --typescript strict --skip-houston --install --git
		          cd astro-hello-world
		        `,
				{ parseMultiLine: true, parseCreate: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toContain("npm create astro@latest");
				expect(result.npm).toContain("cd astro-hello-world");
				expect(result.pnpm).toContain("pnpm create astro@latest");
				expect(result.pnpm).toContain("cd astro-hello-world");
				expect(result.type).toBe("create");
			}
		});

		test("handles multiple command types", () => {
			const result = packmorph(
				outdent`
		          # your-project-folder/astro-hello-world
		          npx astro add @sanity/astro -y
		          npm install astro-portabletext
		        `,
				{ parseMultiLine: true, parseExec: true, parseInstall: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"# your-project-folder/astro-hello-world\nnpx astro add @sanity/astro -y\nnpm install astro-portabletext",
				);
				expect(result.pnpm).toBe(
					"# your-project-folder/astro-hello-world\npnpm dlx astro add @sanity/astro -y\npnpm add astro-portabletext",
				);
				expect(result.yarn).toBe(
					"# your-project-folder/astro-hello-world\nyarn dlx astro add @sanity/astro -y\nyarn add astro-portabletext",
				);
				expect(result.bun).toBe(
					"# your-project-folder/astro-hello-world\nbunx astro add @sanity/astro -y\nbun add astro-portabletext",
				);
			}
		});

		test("handles complex setup script", () => {
			const result = packmorph(
				outdent`
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
			if (result.ok) {
				expect(result.npm).toContain("npm create vite@latest");
				expect(result.npm).toContain("cd my-app");
				expect(result.npm).toContain("npm install\n");
				expect(result.npm).toContain("npx tailwindcss init -p");
				expect(result.npm).toContain("npm run dev");

				expect(result.pnpm).toContain("pnpm create vite@latest");
				expect(result.pnpm).toContain("cd my-app");
				expect(result.pnpm).toContain("pnpm install\n");
				expect(result.pnpm).toContain("pnpm dlx tailwindcss init -p");
				expect(result.pnpm).toContain("pnpm run dev");
			}
		});
	});

	describe("with different parsers enabled", () => {
		test("only parses install commands by default", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          npx prettier .
		          npm run dev
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm install react\nnpx prettier .\nnpm run dev",
				);
				expect(result.pnpm).toBe("pnpm add react\nnpx prettier .\nnpm run dev");
			}
		});

		test("parses exec commands when enabled", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          npx prettier .
		        `,
				{ parseMultiLine: true, parseExec: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm install react\nnpx prettier .");
				expect(result.pnpm).toBe("pnpm add react\npnpm dlx prettier .");
			}
		});

		test("skips unsupported commands silently", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          npm update lodash
		          npm install -D typescript
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				// npm update is not supported, should be preserved as-is
				expect(result.npm).toBe(
					"npm install react\nnpm update lodash\nnpm install -D typescript",
				);
				expect(result.pnpm).toBe(
					"pnpm add react\nnpm update lodash\npnpm add -D typescript",
				);
			}
		});
	});

	describe("edge cases", () => {
		test("handles empty input", () => {
			const result = packmorph("", { parseMultiLine: true });

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-supported-command");
			}
		});

		test("handles only comments", () => {
			const result = packmorph(
				outdent`
		          # Comment 1
		          # Comment 2
		          # Comment 3
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-supported-command");
			}
		});

		test("handles mixed line endings", () => {
			const result = packmorph(
				"npm install react\r\nnpm install -D typescript\nnpm install vitest",
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toContain("npm install react");
				expect(result.npm).toContain("npm install -D typescript");
				expect(result.npm).toContain("npm install vitest");
			}
		});

		test("handles inline comments (parses # as package name)", () => {
			const result = packmorph(
				outdent`
		          npm install react # Install React
		          npm install -D typescript
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				// The parser treats # and following words as package names
				expect(result.npm).toBe(
					"npm install react # Install React\nnpm install -D typescript",
				);
				expect(result.pnpm).toBe(
					"pnpm add react # Install React\npnpm add -D typescript",
				);
				expect(result.yarn).toBe(
					"yarn add react # Install React\nyarn add --dev typescript",
				);
			}
		});

		test("normalizes internal whitespace in parsed commands", () => {
			const result = packmorph(`npm install    react     lodash`, {
				parseMultiLine: true,
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				// Internal whitespace is normalized during parsing
				expect(result.npm).toBe("npm install react lodash");
				expect(result.pnpm).toBe("pnpm add react lodash");
			}
		});
	});

	describe("mixed package managers", () => {
		test("rejects commands with mixed package managers", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          pnpm add typescript
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("mixed-package-managers");
			}
		});

		test("rejects mixed npm and yarn commands", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          yarn add typescript
		          npm install -D vitest
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("mixed-package-managers");
			}
		});

		test("rejects mixed exec commands", () => {
			const result = packmorph(
				outdent`
		          npx prettier .
		          pnpm dlx eslint .
		        `,
				{ parseMultiLine: true, parseExec: true },
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("mixed-package-managers");
			}
		});

		test("allows same package manager with different command types", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          npx prettier .
		          npm run dev
		        `,
				{
					parseMultiLine: true,
					parseInstall: true,
					parseExec: true,
					parseRun: true,
				},
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm install react\nnpx prettier .\nnpm run dev",
				);
				expect(result.pnpm).toBe(
					"pnpm add react\npnpm dlx prettier .\npnpm run dev",
				);
			}
		});

		test("rejects mixed package managers even with non-PM commands in between", () => {
			const result = packmorph(
				outdent`
		          npm install react
		          cd my-project
		          pnpm add typescript
		        `,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("mixed-package-managers");
			}
		});
	});

	describe("type safety", () => {
		test("returns SuccessResult when parseMultiLine is true", () => {
			const result = packmorph("npm install react", {
				parseMultiLine: true,
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(typeof result.npm).toBe("string");
				expect(typeof result.pnpm).toBe("string");
				expect(typeof result.yarn).toBe("string");
				expect(typeof result.bun).toBe("string");
			}
		});

		test("returns PackmorphResult when parseMultiLine is false", () => {
			const result = packmorph("npm install react", {
				parseMultiLine: false,
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(typeof result.npm).toBe("string");
				expect(typeof result.pnpm).toBe("string");
				expect(typeof result.yarn).toBe("string");
				expect(typeof result.bun).toBe("string");
			}
		});
	});

	describe("whitespace preservation", () => {
		test("preserves leading whitespace on unparsed lines", () => {
			// Don't use outdent here - we want to preserve the leading spaces
			const result = packmorph(
				`  npm install react
  cd my-project
  npm install -D typescript`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"  npm install react\n  cd my-project\n  npm install -D typescript",
				);
				expect(result.pnpm).toBe(
					"  pnpm add react\n  cd my-project\n  pnpm add -D typescript",
				);
			}
		});

		test("preserves trailing empty lines", () => {
			const result = packmorph(
				`${outdent`
				          npm install react
				          npm install -D typescript

				        `}\n`,
				{ parseMultiLine: true },
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm install react\nnpm install -D typescript\n\n",
				);
			}
		});
	});
});
