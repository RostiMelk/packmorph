import { INVALID_COMMAND_PATTERNS, PACKAGE_MANAGERS } from "./constants.js";
import type { ErrorResult, PackageManager } from "./types.js";

export function isValidPackageManager(
	manager: string,
): manager is PackageManager {
	return PACKAGE_MANAGERS.includes(manager as PackageManager);
}

export function validateCommand(
	command: string,
	pattern: RegExp = INVALID_COMMAND_PATTERNS.STANDARD,
): ErrorResult | null {
	const trimmed = command.trim();

	if (!trimmed) {
		return { ok: false, reason: "not-supported-command" };
	}

	if (pattern.test(trimmed)) {
		return { ok: false, reason: "not-supported-command" };
	}

	return null;
}

export function createErrorResult(reason: ErrorResult["reason"]): ErrorResult {
	return { ok: false, reason };
}

export function buildCommand(parts: (string | string[])[]): string {
	return parts
		.flat()
		.filter((part) => part !== "")
		.join(" ");
}
