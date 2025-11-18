import type { ErrorResult, ParsedCreateCommand } from "../types.js";
import {
	createErrorResult,
	isValidPackageManager,
	validateCommand,
} from "../utils.js";

export function parseCreateCommand(
	command: string,
): ParsedCreateCommand | ErrorResult {
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

	if (subcommand !== "create") {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length === 2) {
		return createErrorResult("parse-error");
	}

	const template = parts[2];

	if (!template) {
		return createErrorResult("parse-error");
	}

	const remainingArgs = parts.slice(3);
	const additionalArgs: string[] = [];
	let foundSeparator = false;

	for (const arg of remainingArgs) {
		if (!arg) {
			continue;
		}

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
