export type {
	CommandMeta,
	CreateMeta,
	CreateSuccessResult,
	ErrorResult,
	ExecMeta,
	ExecSuccessResult,
	InstallSuccessResult,
	MultiLineResult,
	PackageManager,
	PackmorphMultiLineResult,
	PackmorphOptions,
	PackmorphResult,
	ParsedCommand,
	ParsedCreateCommand,
	ParsedExecCommand,
	ParsedInstallCommand,
	ParsedRunCommand,
	RunMeta,
	RunSuccessResult,
	SuccessResult,
} from "./types.js";

import { generateCreateCommands } from "./generators/create.js";
import { generateExecCommands } from "./generators/exec.js";
import { generateInstallCommands } from "./generators/install.js";
import { generateRunCommands } from "./generators/run.js";
import { parseCreateCommand } from "./parsers/create.js";
import { parseExecCommand } from "./parsers/exec.js";
import { parseInstallCommand } from "./parsers/install.js";
import { parseRunCommand } from "./parsers/run.js";
import type {
	ErrorResult,
	MultiLineResult,
	PackageManager,
	PackmorphMultiLineResult,
	PackmorphOptions,
	PackmorphResult,
	ParsedCommand,
} from "./types.js";

const DEFAULT_OPTIONS: Required<PackmorphOptions> = {
	parseInstall: true,
	parseExec: false,
	parseRun: false,
	parseCreate: false,
	parseMultiLine: false,
};

function parseCommand(
	command: string,
	options: Required<PackmorphOptions>,
): ParsedCommand | ErrorResult {
	const parsers: Array<{
		enabled: boolean;
		parse: (cmd: string) => ParsedCommand | ErrorResult;
	}> = [
		{ enabled: options.parseInstall, parse: parseInstallCommand },
		{ enabled: options.parseExec, parse: parseExecCommand },
		{ enabled: options.parseRun, parse: parseRunCommand },
		{ enabled: options.parseCreate, parse: parseCreateCommand },
	];

	let lastError: ErrorResult | null = null;

	for (const { enabled, parse } of parsers) {
		if (!enabled) continue;

		const result = parse(command);
		if ("ok" in result && !result.ok) {
			lastError = result;
			continue;
		}
		return result;
	}

	// Return the last error if we have one, otherwise return not-supported-command
	// For backwards compatibility, if only parseInstall is enabled, return not-install-command errors
	if (lastError) {
		return lastError;
	}

	return { ok: false, reason: "not-supported-command" };
}

function generateCommands(parsed: ParsedCommand): PackmorphResult {
	switch (parsed.type) {
		case "install":
			return generateInstallCommands(parsed);
		case "exec":
			return generateExecCommands(parsed);
		case "run":
			return generateRunCommands(parsed);
		case "create":
			return generateCreateCommands(parsed);
	}
}

/**
 * Convert package manager commands between npm, pnpm, Yarn, and Bun.
 *
 * @param command - The package manager command to convert
 * @param options - Optional configuration to enable different command types
 * @param options.parseInstall - Enable install/add command parsing (default: true)
 * @param options.parseExec - Enable exec command parsing (npx, dlx, bunx) (default: false)
 * @param options.parseRun - Enable run command parsing (default: false)
 * @param options.parseCreate - Enable create command parsing (default: false)
 * @param options.parseMultiLine - Enable multi-line command parsing (default: false)
 * @returns Result object with converted commands for all package managers, or an error
 *
 * @example
 * // Install commands (enabled by default)
 * packmorph("npm install react")
 * // → { ok: true, npm: "npm install react", pnpm: "pnpm add react", ... }
 *
 * @example
 * // Exec commands (opt-in)
 * packmorph("npx prettier .", { parseExec: true })
 * // → { ok: true, npm: "npx prettier .", pnpm: "pnpm dlx prettier .", ... }
 *
 * @example
 * // Run commands (opt-in)
 * packmorph("npm run dev", { parseRun: true })
 * // → { ok: true, npm: "npm run dev", pnpm: "pnpm run dev", ... }
 *
 * @example
 * // Create commands (opt-in, handles npm's -- separator automatically)
 * packmorph("npm create vite my-app", { parseCreate: true })
 * // → { ok: true, npm: "npm create vite -- my-app", pnpm: "pnpm create vite my-app", ... }
 *
 * @example
 * // Multi-line command blocks (opt-in, ignores comments and unsupported commands)
 * packmorph(`
 *   # Install dependencies
 *   npm install react
 *   npm install -D typescript
 * `, { parseMultiLine: true })
 * // → { ok: true, commands: [{ original: "npm install react", result: {...} }, ...] }
 *
 * @example
 * // Enable all command types
 * packmorph(command, {
 *   parseInstall: true,
 *   parseExec: true,
 *   parseRun: true,
 *   parseCreate: true
 * })
 */
export function packmorph(
	command: string,
	options?: PackmorphOptions & { parseMultiLine?: false },
): PackmorphResult;
export function packmorph(
	command: string,
	options: PackmorphOptions & { parseMultiLine: true },
): PackmorphMultiLineResult;
export function packmorph(
	command: string,
	options: PackmorphOptions = {},
): PackmorphResult | PackmorphMultiLineResult {
	const opts: Required<PackmorphOptions> = {
		...DEFAULT_OPTIONS,
		...options,
	};

	if (opts.parseMultiLine) {
		return parseMultiLineCommands(command, opts);
	}

	const parsed = parseCommand(command, opts);

	if ("ok" in parsed && !parsed.ok) {
		return parsed;
	}

	return generateCommands(parsed as ParsedCommand);
}

function parseMultiLineCommands(
	input: string,
	options: Required<PackmorphOptions>,
): MultiLineResult | ErrorResult {
	const lines = input.split("\n");
	const results: MultiLineResult["commands"] = [];
	let detectedManager: PackageManager | null = null;

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip empty lines and comments - they'll be preserved by the consumer
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		const parsed = parseCommand(trimmed, options);

		if ("ok" in parsed && !parsed.ok) {
			// Skip commands that couldn't be parsed - they'll be preserved by the consumer
			continue;
		}

		const parsedCommand = parsed as ParsedCommand;

		// Check for mixed package managers
		if (detectedManager === null) {
			detectedManager = parsedCommand.manager;
		} else if (detectedManager !== parsedCommand.manager) {
			return {
				ok: false,
				reason: "mixed-package-managers",
			};
		}

		const result = generateCommands(parsedCommand);
		results.push({
			original: trimmed,
			result,
		});
	}

	return {
		ok: true,
		commands: results,
	};
}

export default packmorph;
