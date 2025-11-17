import type {
	ErrorResult,
	PackageManager,
	ParsedRunCommand,
} from "../types.js";

export function parseRunCommand(
	command: string,
): ParsedRunCommand | ErrorResult {
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

	if (subcommand !== "run") {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length === 2) {
		return { ok: false, reason: "parse-error" };
	}

	const script = parts[2];

	if (!script) {
		return { ok: false, reason: "parse-error" };
	}

	const args = parts.slice(3);

	return {
		type: "run",
		manager,
		script,
		args,
	};
}
