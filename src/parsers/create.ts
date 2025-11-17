import type {
	ErrorResult,
	PackageManager,
	ParsedCreateCommand,
} from "../types.js";

export function parseCreateCommand(
	command: string,
): ParsedCreateCommand | ErrorResult {
	const trimmed = command.trim();

	if (!trimmed) {
		return { ok: false, reason: "not-supported-command" };
	}

	if (/[;\n]|&&|\|\||(\(.*\)(?!\s*(npm|pnpm|yarn|bun)))/.test(trimmed)) {
		return { ok: false, reason: "not-supported-command" };
	}

	const parts = trimmed.split(/\s+/);

	if (parts.length === 0) {
		return { ok: false, reason: "not-supported-command" };
	}

	const manager = parts[0];

	if (
		manager !== "npm" &&
		manager !== "pnpm" &&
		manager !== "yarn" &&
		manager !== "bun"
	) {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length === 1) {
		return { ok: false, reason: "parse-error" };
	}

	const subcommand = parts[1];

	if (subcommand !== "create") {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length === 2) {
		return { ok: false, reason: "parse-error" };
	}

	const template = parts[2];

	if (!template) {
		return { ok: false, reason: "parse-error" };
	}

	// Handle -- separator (mainly for npm create)
	// npm create template -- --flag arg
	// pnpm/yarn/bun create template --flag arg
	const remainingArgs = parts.slice(3);
	const additionalArgs: string[] = [];
	let foundSeparator = false;

	for (const arg of remainingArgs) {
		if (!arg) {
			continue;
		}

		// Track if we've seen the -- separator
		if (arg === "--") {
			foundSeparator = true;
			continue;
		}

		additionalArgs.push(arg);
	}

	return {
		type: "create",
		manager,
		template,
		additionalArgs,
		hasDoubleDashSeparator: foundSeparator,
	};
}
