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
	// Check if quoting is needed
	// For originally-quoted values: preserve quotes if value has ANY special characters (including globs)
	// For auto-quoting: only quote characters that break shell parsing (not globs)
	const hasSpecialChars =
		value === "" || /[\s$&|()<>"`'\\;*?[\]{}!~@]/.test(value);
	const needsAutoQuoting = value === "" || /[\s$&|()<>"`'\\;]/.test(value);

	// If it was originally quoted, preserve quotes only if the value has special characters
	// This allows normalization (removing unnecessary quotes from simple values like "react")
	// while preserving quotes on values that need them (like "@/*")
	if (wasQuoted && hasSpecialChars) {
		const char = quoteChar || '"';
		const escaped = value.replace(new RegExp(`\\${char}`, "g"), `\\${char}`);
		return `${char}${escaped}${char}`;
	}

	// Auto-quote if needed (for unquoted values with spaces, $, etc.)
	if (needsAutoQuoting) {
		const escaped = value.replace(/"/g, '\\"');
		return `"${escaped}"`;
	}

	// No quoting needed (or quoted but doesn't need quotes - normalize)
	return value;
}
