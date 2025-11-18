export type {
	CommandMeta,
	CreateMeta,
	CreateSuccessResult,
	ErrorResult,
	ExecMeta,
	ExecSuccessResult,
	InstallSuccessResult,
	PackageManager,
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

import type { CommandNode } from "./ast.js";
import { INVALID_COMMAND_PATTERNS } from "./constants.js";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Transformer } from "./transformer.js";
import type {
	ErrorResult,
	PackageManager,
	PackmorphOptions,
	PackmorphResult,
	SuccessResult,
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
): CommandNode | ErrorResult {
	// Validate command doesn't contain shell operators or multiline
	const trimmed = command.trim();

	if (!trimmed) {
		return { ok: false, reason: "not-supported-command" };
	}

	// Check for invalid patterns based on command type
	let pattern = INVALID_COMMAND_PATTERNS.STANDARD;

	// Check if this is an exec command
	const isExecCommand =
		trimmed.startsWith("npx ") ||
		trimmed === "npx" ||
		trimmed.startsWith("bunx ") ||
		trimmed === "bunx" ||
		/^(pnpm|yarn)\s+dlx(\s|$)/.test(trimmed);

	// If it's an exec command but parseExec is disabled, return error
	if (isExecCommand && !options.parseExec) {
		return { ok: false, reason: "not-supported-command" };
	}

	// Use appropriate pattern for validation
	if (isExecCommand) {
		pattern = INVALID_COMMAND_PATTERNS.EXEC;
	}

	if (pattern.test(trimmed)) {
		return { ok: false, reason: "not-supported-command" };
	}

	// Tokenize and parse
	const lexer = new Lexer(trimmed);
	const tokens = lexer.tokenize();
	const parser = new Parser(tokens);
	const ast = parser.parse();

	// If parsing failed, return the error
	if ("ok" in ast && !ast.ok) {
		return ast;
	}

	const commandNode = ast as CommandNode;

	// Check if the parsed command type is enabled
	if (commandNode.type === "InstallCommand" && !options.parseInstall) {
		return { ok: false, reason: "disabled-command-type" };
	}
	if (commandNode.type === "ExecCommand" && !options.parseExec) {
		return { ok: false, reason: "not-supported-command" };
	}
	if (commandNode.type === "RunCommand" && !options.parseRun) {
		return { ok: false, reason: "not-supported-command" };
	}
	if (commandNode.type === "CreateCommand" && !options.parseCreate) {
		return { ok: false, reason: "not-supported-command" };
	}

	return commandNode;
}

function generateCommands(ast: CommandNode): PackmorphResult {
	const transformer = new Transformer();
	return transformer.transform(ast);
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
): PackmorphResult;
export function packmorph(
	command: string,
	options: PackmorphOptions = {},
): PackmorphResult {
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

	return generateCommands(parsed as CommandNode);
}

function parseMultiLineCommands(
	input: string,
	options: Required<PackmorphOptions>,
): SuccessResult | ErrorResult {
	const lines = input.split("\n");
	const parsedCommands: Array<{
		original: string;
		result: SuccessResult;
	}> = [];
	let detectedManager: PackageManager | null = null;

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip empty lines and comments - they'll be preserved in output
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		const parsed = parseCommand(trimmed, options);

		if ("ok" in parsed && !parsed.ok) {
			// Skip commands that couldn't be parsed - they'll be preserved in output
			continue;
		}

		const parsedCommand = parsed as CommandNode;

		// Check for mixed package managers
		if (detectedManager === null) {
			detectedManager = parsedCommand.manager.value;
		} else if (detectedManager !== parsedCommand.manager.value) {
			return {
				ok: false,
				reason: "mixed-package-managers",
			};
		}

		const result = generateCommands(parsedCommand);
		if (result.ok) {
			parsedCommands.push({
				original: trimmed,
				result,
			});
		}
	}

	// If no commands were parsed successfully, return error
	if (parsedCommands.length === 0) {
		return {
			ok: false,
			reason: "not-supported-command",
		};
	}

	// Create a map of original commands to their results for quick lookup
	const commandMap = new Map(
		parsedCommands.map((cmd) => [cmd.original, cmd.result]),
	);

	// Process each line and build output for each package manager
	const npmLines: string[] = [];
	const pnpmLines: string[] = [];
	const yarnLines: string[] = [];
	const bunLines: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		const parsedResult = commandMap.get(trimmed);

		if (parsedResult) {
			// Line was successfully parsed - use transformed commands
			// Preserve any leading/trailing whitespace from original line
			const leadingWhitespace = line.match(/^\s*/)?.[0] || "";
			const trailingWhitespace = line.match(/\s*$/)?.[0] || "";

			npmLines.push(leadingWhitespace + parsedResult.npm + trailingWhitespace);
			pnpmLines.push(
				leadingWhitespace + parsedResult.pnpm + trailingWhitespace,
			);
			yarnLines.push(
				leadingWhitespace + parsedResult.yarn + trailingWhitespace,
			);
			bunLines.push(leadingWhitespace + parsedResult.bun + trailingWhitespace);
		} else {
			// Line wasn't parsed (empty, comment, or non-PM command) - preserve as-is
			npmLines.push(line);
			pnpmLines.push(line);
			yarnLines.push(line);
			bunLines.push(line);
		}
	}

	// Determine the primary type (use the first command's type)
	const firstCommand = parsedCommands[0];
	if (!firstCommand) {
		return {
			ok: false,
			reason: "not-supported-command",
		};
	}

	const primaryType = firstCommand.result.type;

	// Return a result that matches the SuccessResult interface
	return {
		ok: true,
		type: primaryType,
		npm: npmLines.join("\n"),
		pnpm: pnpmLines.join("\n"),
		yarn: yarnLines.join("\n"),
		bun: bunLines.join("\n"),
		meta: firstCommand.result.meta,
	} as SuccessResult;
}

export default packmorph;
