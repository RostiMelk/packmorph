import { INVALID_COMMAND_PATTERNS } from "../constants.js";
import type {
	ErrorResult,
	PackageManager,
	ParsedExecCommand,
} from "../types.js";
import { createErrorResult, validateCommand } from "../utils.js";

export function parseExecCommand(
	command: string,
): ParsedExecCommand | ErrorResult {
	const validationError = validateCommand(
		command,
		INVALID_COMMAND_PATTERNS.EXEC,
	);
	if (validationError) {
		return validationError;
	}

	const parts = command.trim().split(/\s+/);

	if (parts.length === 0) {
		return { ok: false, reason: "not-supported-command" };
	}

	let manager: PackageManager | null = null;
	let packageStartIndex = 1;

	if (parts[0] === "npx") {
		manager = "npm";
	} else if (parts[0] === "pnpm" && parts[1] === "dlx") {
		manager = "pnpm";
		packageStartIndex = 2;
	} else if (parts[0] === "yarn" && parts[1] === "dlx") {
		manager = "yarn";
		packageStartIndex = 2;
	} else if (parts[0] === "bunx") {
		manager = "bun";
	} else {
		return { ok: false, reason: "not-supported-command" };
	}

	if (parts.length <= packageStartIndex) {
		return createErrorResult("parse-error");
	}

	const remainingArgs = parts.slice(packageStartIndex);
	const flags: string[] = [];
	let packageName = "";
	const args: string[] = [];
	let foundPackage = false;

	for (let i = 0; i < remainingArgs.length; i++) {
		const arg = remainingArgs[i];

		if (!arg) {
			continue;
		}

		if (!foundPackage) {
			if (arg.startsWith("-")) {
				flags.push(arg);
			} else {
				packageName = arg;
				foundPackage = true;
			}
		} else {
			args.push(arg);
		}
	}

	if (!packageName) {
		return createErrorResult("parse-error");
	}

	return {
		type: "exec",
		manager,
		package: packageName,
		args,
		flags,
	};
}
