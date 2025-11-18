import { FLAG_MAP } from "../constants.js";
import type { ErrorResult, ParsedInstallCommand } from "../types.js";
import {
	createErrorResult,
	isValidPackageManager,
	validateCommand,
} from "../utils.js";

export function parseInstallCommand(
	command: string,
): ParsedInstallCommand | ErrorResult {
	const validationError = validateCommand(command);
	if (validationError) {
		return { ok: false, reason: "not-install-command" };
	}

	const parts = command.trim().split(/\s+/);

	if (parts.length === 0) {
		return { ok: false, reason: "not-install-command" };
	}

	const manager = parts[0];

	if (!manager || !isValidPackageManager(manager)) {
		return { ok: false, reason: "not-install-command" };
	}

	if (parts.length === 1) {
		return createErrorResult("parse-error");
	}

	const subcommand = parts[1];
	let argsStartIndex = 2;
	let isYarnGlobal = false;

	if (manager === "npm") {
		if (subcommand !== "install" && subcommand !== "i") {
			return { ok: false, reason: "not-install-command" };
		}
	} else if (manager === "pnpm") {
		if (subcommand !== "add" && subcommand !== "install") {
			return { ok: false, reason: "not-install-command" };
		}
	} else if (manager === "yarn") {
		if (subcommand === "global") {
			if (parts.length < 3 || parts[2] !== "add") {
				return { ok: false, reason: "not-install-command" };
			}
			argsStartIndex = 3;
			isYarnGlobal = true;
		} else if (subcommand !== "add" && subcommand !== "install") {
			return { ok: false, reason: "not-install-command" };
		}
	} else if (manager === "bun") {
		if (subcommand !== "add" && subcommand !== "install") {
			return { ok: false, reason: "not-install-command" };
		}
	}

	const args = parts.slice(argsStartIndex);
	const packages: string[] = [];
	const rawFlags: string[] = [];
	const flagState = {
		dev: false,
		global: isYarnGlobal,
		exact: false,
		optional: false,
		peer: false,
		frozen: false,
	};

	let i = 0;
	while (i < args.length) {
		const arg = args[i];

		if (!arg) {
			i++;
			continue;
		}

		if (arg === "--") {
			if (i === args.length - 1) {
				return createErrorResult("parse-error");
			}
			i++;
			continue;
		}

		if (arg.startsWith("-")) {
			const flagKey = FLAG_MAP[arg as keyof typeof FLAG_MAP];
			if (flagKey) {
				flagState[flagKey] = true;
			}
			rawFlags.push(arg);
		} else {
			packages.push(arg);
		}

		i++;
	}

	return {
		type: "install",
		manager,
		packages,
		flags: {
			...flagState,
			rawFlags,
		},
	};
}
