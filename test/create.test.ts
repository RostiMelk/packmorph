import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index.js";

describe("create commands", () => {
	describe("npm create", () => {
		test("basic npm create command", () => {
			const result = packmorph("npm create vite", { parseCreate: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite");
				expect(result.pnpm).toBe("pnpm create vite");
				expect(result.yarn).toBe("yarn create vite");
				expect(result.bun).toBe("bun create vite");
				expect(result.meta.type).toBe("create");
				expect(result.meta.manager).toBe("npm");
				expect(result.meta.template).toBe("vite");
				expect(result.meta.additionalArgs).toEqual([]);
			}
		});

		test("npm create with version", () => {
			const result = packmorph("npm create vite@latest", { parseCreate: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite@latest");
				expect(result.pnpm).toBe("pnpm create vite@latest");
				expect(result.yarn).toBe("yarn create vite@latest");
				expect(result.bun).toBe("bun create vite@latest");
				expect(result.meta.template).toBe("vite@latest");
			}
		});

		test("npm create with project name", () => {
			const result = packmorph("npm create next-app my-app", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create next-app -- my-app");
				expect(result.pnpm).toBe("pnpm create next-app my-app");
				expect(result.yarn).toBe("yarn create next-app my-app");
				expect(result.bun).toBe("bun create next-app my-app");
				expect(result.meta.template).toBe("next-app");
				expect(result.meta.additionalArgs).toEqual(["my-app"]);
			}
		});

		test("npm create with flags", () => {
			const result = packmorph("npm create vite --template react", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite -- --template react");
				expect(result.pnpm).toBe("pnpm create vite --template react");
				expect(result.yarn).toBe("yarn create vite --template react");
				expect(result.bun).toBe("bun create vite --template react");
				expect(result.meta.template).toBe("vite");
				expect(result.meta.additionalArgs).toEqual(["--template", "react"]);
			}
		});

		test("npm create with -- separator (npm native format)", () => {
			const result = packmorph(
				"npm create sanity@latest -- --template sanity-io/foo --project bar --dataset production",
				{ parseCreate: true },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm create sanity@latest -- --template sanity-io/foo --project bar --dataset production",
				);
				expect(result.pnpm).toBe(
					"pnpm create sanity@latest --template sanity-io/foo --project bar --dataset production",
				);
				expect(result.yarn).toBe(
					"yarn create sanity@latest --template sanity-io/foo --project bar --dataset production",
				);
				expect(result.bun).toBe(
					"bun create sanity@latest --template sanity-io/foo --project bar --dataset production",
				);
				expect(result.meta.template).toBe("sanity@latest");
				expect(result.meta.additionalArgs).toEqual([
					"--template",
					"sanity-io/foo",
					"--project",
					"bar",
					"--dataset",
					"production",
				]);
			}
		});

		test("npm create with multiple flags and args", () => {
			const result = packmorph(
				"npm create vite my-app --template react-ts --skip-git",
				{ parseCreate: true },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm create vite -- my-app --template react-ts --skip-git",
				);
				expect(result.pnpm).toBe(
					"pnpm create vite my-app --template react-ts --skip-git",
				);
				expect(result.yarn).toBe(
					"yarn create vite my-app --template react-ts --skip-git",
				);
				expect(result.bun).toBe(
					"bun create vite my-app --template react-ts --skip-git",
				);
				expect(result.meta.template).toBe("vite");
				expect(result.meta.additionalArgs).toEqual([
					"my-app",
					"--template",
					"react-ts",
					"--skip-git",
				]);
			}
		});
	});

	describe("pnpm create", () => {
		test("basic pnpm create command", () => {
			const result = packmorph("pnpm create astro", { parseCreate: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create astro");
				expect(result.pnpm).toBe("pnpm create astro");
				expect(result.yarn).toBe("yarn create astro");
				expect(result.bun).toBe("bun create astro");
				expect(result.meta.type).toBe("create");
				expect(result.meta.manager).toBe("pnpm");
				expect(result.meta.template).toBe("astro");
			}
		});

		test("pnpm create with project name", () => {
			const result = packmorph("pnpm create vite my-project", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite -- my-project");
				expect(result.pnpm).toBe("pnpm create vite my-project");
				expect(result.yarn).toBe("yarn create vite my-project");
				expect(result.bun).toBe("bun create vite my-project");
				expect(result.meta.additionalArgs).toEqual(["my-project"]);
			}
		});

		test("pnpm create with flags", () => {
			const result = packmorph("pnpm create next-app --typescript", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create next-app -- --typescript");
				expect(result.pnpm).toBe("pnpm create next-app --typescript");
				expect(result.yarn).toBe("yarn create next-app --typescript");
				expect(result.bun).toBe("bun create next-app --typescript");
				expect(result.meta.additionalArgs).toEqual(["--typescript"]);
			}
		});

		test("pnpm create with multiple flags (no -- needed)", () => {
			const result = packmorph(
				"pnpm create sanity@latest --template sanity-io/foo --project bar",
				{ parseCreate: true },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe(
					"npm create sanity@latest -- --template sanity-io/foo --project bar",
				);
				expect(result.pnpm).toBe(
					"pnpm create sanity@latest --template sanity-io/foo --project bar",
				);
				expect(result.yarn).toBe(
					"yarn create sanity@latest --template sanity-io/foo --project bar",
				);
				expect(result.bun).toBe(
					"bun create sanity@latest --template sanity-io/foo --project bar",
				);
			}
		});
	});

	describe("yarn create", () => {
		test("basic yarn create command", () => {
			const result = packmorph("yarn create react-app", { parseCreate: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create react-app");
				expect(result.pnpm).toBe("pnpm create react-app");
				expect(result.yarn).toBe("yarn create react-app");
				expect(result.bun).toBe("bun create react-app");
				expect(result.meta.type).toBe("create");
				expect(result.meta.manager).toBe("yarn");
				expect(result.meta.template).toBe("react-app");
			}
		});

		test("yarn create with project name", () => {
			const result = packmorph("yarn create vite my-app", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite -- my-app");
				expect(result.pnpm).toBe("pnpm create vite my-app");
				expect(result.yarn).toBe("yarn create vite my-app");
				expect(result.bun).toBe("bun create vite my-app");
				expect(result.meta.additionalArgs).toEqual(["my-app"]);
			}
		});

		test("yarn create with flags", () => {
			const result = packmorph("yarn create vite --template vue", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite -- --template vue");
				expect(result.pnpm).toBe("pnpm create vite --template vue");
				expect(result.yarn).toBe("yarn create vite --template vue");
				expect(result.bun).toBe("bun create vite --template vue");
				expect(result.meta.additionalArgs).toEqual(["--template", "vue"]);
			}
		});
	});

	describe("bun create", () => {
		test("basic bun create command", () => {
			const result = packmorph("bun create elysia", { parseCreate: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create elysia");
				expect(result.pnpm).toBe("pnpm create elysia");
				expect(result.yarn).toBe("yarn create elysia");
				expect(result.bun).toBe("bun create elysia");
				expect(result.meta.type).toBe("create");
				expect(result.meta.manager).toBe("bun");
				expect(result.meta.template).toBe("elysia");
			}
		});

		test("bun create with project name", () => {
			const result = packmorph("bun create next my-next-app", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create next -- my-next-app");
				expect(result.pnpm).toBe("pnpm create next my-next-app");
				expect(result.yarn).toBe("yarn create next my-next-app");
				expect(result.bun).toBe("bun create next my-next-app");
				expect(result.meta.template).toBe("next");
				expect(result.meta.additionalArgs).toEqual(["my-next-app"]);
			}
		});

		test("bun create with flags", () => {
			const result = packmorph("bun create vite --template svelte", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.npm).toBe("npm create vite -- --template svelte");
				expect(result.pnpm).toBe("pnpm create vite --template svelte");
				expect(result.yarn).toBe("yarn create vite --template svelte");
				expect(result.bun).toBe("bun create vite --template svelte");
				expect(result.meta.additionalArgs).toEqual(["--template", "svelte"]);
			}
		});
	});

	describe("error cases", () => {
		test("rejects create commands when parseCreate is false", () => {
			const result = packmorph("npm create vite");
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-supported-command");
			}
		});

		test("rejects npm create without template name", () => {
			const result = packmorph("npm create", { parseCreate: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects pnpm create without template name", () => {
			const result = packmorph("pnpm create", { parseCreate: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects yarn create without template name", () => {
			const result = packmorph("yarn create", { parseCreate: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects bun create without template name", () => {
			const result = packmorph("bun create", { parseCreate: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("parse-error");
			}
		});

		test("rejects invalid package manager", () => {
			const result = packmorph("cargo create my-app", { parseCreate: true });
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not-supported-command");
			}
		});
	});

	describe("edge cases", () => {
		test("handles extra whitespace", () => {
			const result = packmorph("npm  create   vite", { parseCreate: true });
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.template).toBe("vite");
			}
		});

		test("handles scoped templates", () => {
			const result = packmorph("npm create @vitejs/app", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.template).toBe("@vitejs/app");
			}
		});

		test("handles scoped templates with version", () => {
			const result = packmorph("npm create @vitejs/app@latest my-app", {
				parseCreate: true,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.meta.template).toBe("@vitejs/app@latest");
				expect(result.meta.additionalArgs).toEqual(["my-app"]);
			}
		});
	});
});
