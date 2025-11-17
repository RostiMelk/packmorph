import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("error cases - not-install-command", () => {
	test("rejects npm run command", () => {
		const result = packmorph("npm run dev");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects pnpm run command", () => {
		const result = packmorph("pnpm run build");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects yarn run command", () => {
		const result = packmorph("yarn run dev");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects bun run command", () => {
		const result = packmorph("bun run build");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects empty string", () => {
		const result = packmorph("");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects just npm", () => {
		const result = packmorph("npm");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("parse-error");
		}
	});

	test("rejects npm update", () => {
		const result = packmorph("npm update react");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects pnpm update", () => {
		const result = packmorph("pnpm update react");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects yarn update", () => {
		const result = packmorph("yarn update react");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects bun update", () => {
		const result = packmorph("bun update react");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects other package managers", () => {
		const result = packmorph("cargo add some-crate");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});
});

describe("error cases - parse-error", () => {
	test("rejects pnpm add with only --", () => {
		const result = packmorph("pnpm add --");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("parse-error");
		}
	});

	test("rejects npm install with only --", () => {
		const result = packmorph("npm install --");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("parse-error");
		}
	});
});

describe("error cases - code blocks", () => {
	test("rejects code block with other code before command", () => {
		const result = packmorph("const result = npm install react");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects code block with semicolon and other code", () => {
		const result = packmorph("npm install react; console.log('done')");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects multiline code snippet", () => {
		const result = packmorph(`const pkg = 'react';
npm install react
console.log('installed');`);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects code with function call wrapping command", () => {
		const result = packmorph("exec('npm install react')");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects command with && shell operator after", () => {
		const result = packmorph("npm install react && echo done");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects command with || shell operator after", () => {
		const result = packmorph("pnpm add typescript || exit 1");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});

	test("rejects command chained with multiple operators", () => {
		const result = packmorph("yarn add lodash && npm run build || echo fail");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("not-install-command");
		}
	});
});
