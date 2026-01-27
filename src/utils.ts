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

/**
 * Quotes an argument if it contains special characters that require quoting.
 * Preserves the original quote character if the argument was originally quoted and needs quoting.
 * @param value - The argument value
 * @param wasQuoted - Whether the argument was originally quoted
 * @param quoteChar - The original quote character used ('"' or "'")
 * @returns The properly quoted argument, or the original value if no quoting is needed
 */
export function quoteArgument(
	value: string,
	wasQuoted?: boolean,
	quoteChar?: '"' | "'",
): string {
	// Empty strings need quoting
	// Check if quoting is needed (empty, spaces, or shell operators that would break parsing)
	// Include: spaces, $, &, |, (, ), <, >, ", `, ', \
	// Note: We preserve quotes if they were originally present (wasQuoted=true)
	// but only auto-quote for characters that would break command parsing
	const needsQuoting = value === "" || /[\s$&|()<>"`'\\]/.test(value);

	if (needsQuoting) {
		// If it was originally quoted, preserve the original quote character
		if (wasQuoted) {
			const char = quoteChar || '"';
			const escaped = value.replace(new RegExp(`\\${char}`, "g"), `\\${char}`);
			return `${char}${escaped}${char}`;
		}
		// Otherwise, use double quotes by default
		const escaped = value.replace(/"/g, '\\"');
		return `"${escaped}"`;
	}

	// No quoting needed
	return value;
}
