import type { ErrorResult, ParsedRunCommand } from "../types.js";
import {
	createErrorResult,
	isValidPackageManager,
	validateCommand,
} from "../utils.js";

export function parseRunCommand(
	command: string,
): ParsedRunCommand | ErrorResult {
	const validationError = validateCommand(command);
	if (validationError) {
		return validationError;
	}

	const parts = command.trim().split(/\s+/);

	if (parts.length === 0) {
		return { ok: false, reason: "not-supported-command" };
	}

	const manager = parts[0];

	if (!manager || !isValidPackageManager(manager)) {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length === 1) {
		return createErrorResult("parse-error");
	}

	const subcommand = parts[1];

	if (subcommand !== "run") {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length === 2) {
		return createErrorResult("parse-error");
	}

	const script = parts[2];

	if (!script) {
		return createErrorResult("parse-error");
	}

	const args = parts.slice(3);

	return {
		type: "run",
		manager,
		script,
		args,
	};
}
