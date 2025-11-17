export type {
	CommandMeta,
	ErrorResult,
	PackageManager,
	PackmorphResult,
	SuccessResult,
} from "./types.js";

import type {
	ErrorResult,
	PackageManager,
	PackmorphResult,
	SuccessResult,
} from "./types.js";

interface ParsedCommand {
	manager: PackageManager;
	packages: string[];
	flags: {
		dev: boolean;
		global: boolean;
		exact: boolean;
		optional: boolean;
		peer: boolean;
		frozen: boolean;
		rawFlags: string[];
	};
}

function parseCommand(command: string): ParsedCommand | ErrorResult {
	const trimmed = command.trim();

	if (!trimmed) {
		return { ok: false, reason: "not-install-command" };
	}

	// Reject code blocks with surrounding code
	// This regex checks for several patterns that indicate the command is part of a larger
	// shell script or code block rather than a standalone package manager install command:
	// - Semicolons (;) which separate shell commands
	// - Newlines (\n) which indicate multiple lines of code
	// - Logical operators (&& or ||) which chain commands together
	// - Parentheses wrapping expressions that aren't immediately followed by a package manager name
	//   (this catches command substitution like $(command) or subshells)
	// The negative lookahead (?!\s*(npm|pnpm|yarn|bun)) ensures we allow patterns like
	// "(cd dir) && npm install" but reject general command substitution patterns.
	// By rejecting these patterns, we ensure we only process simple, direct package manager
	// install commands rather than complex shell scripts.
	if (/[;\n]|&&|\|\||(\(.*\)(?!\s*(npm|pnpm|yarn|bun)))/.test(trimmed)) {
		return { ok: false, reason: "not-install-command" };
	}

	const parts = trimmed.split(/\s+/);

	if (parts.length === 0) {
		return { ok: false, reason: "not-install-command" };
	}

	const manager = parts[0];

	if (
		manager !== "npm" &&
		manager !== "pnpm" &&
		manager !== "yarn" &&
		manager !== "bun"
	) {
		return { ok: false, reason: "not-install-command" };
	}

	if (parts.length === 1) {
		return { ok: false, reason: "parse-error" };
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

	const flagMap: Record<string, keyof typeof flagState> = {
		"-D": "dev",
		"--save-dev": "dev",
		"--dev": "dev",
		"-d": "dev",
		"-g": "global",
		"--global": "global",
		"-E": "exact",
		"--save-exact": "exact",
		"--exact": "exact",
		"-O": "optional",
		"--save-optional": "optional",
		"--optional": "optional",
		"-P": "peer",
		"--save-peer": "peer",
		"--peer": "peer",
		"--frozen-lockfile": "frozen",
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
				return { ok: false, reason: "parse-error" };
			}
			i++;
			continue;
		}

		if (arg.startsWith("-")) {
			const flagKey = flagMap[arg];
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
		manager,
		packages,
		flags: {
			...flagState,
			rawFlags,
		},
	};
}

function generateCommands(parsed: ParsedCommand): SuccessResult {
	const { manager, packages, flags } = parsed;
	const hasPackages = packages.length > 0;

	const npmParts: string[] = ["npm", "install"];
	const pnpmParts: string[] = hasPackages
		? ["pnpm", "add"]
		: ["pnpm", "install"];
	const yarnParts: string[] = [];
	const bunParts: string[] = hasPackages ? ["bun", "add"] : ["bun", "install"];

	if (flags.global) {
		if (hasPackages) {
			yarnParts.push("yarn", "global", "add");
		} else {
			yarnParts.push("yarn", "install");
		}
	} else {
		if (hasPackages) {
			yarnParts.push("yarn", "add");
		} else {
			yarnParts.push("yarn", "install");
		}
	}

	const knownFlags = new Set([
		"-D",
		"--save-dev",
		"--dev",
		"-d",
		"-g",
		"--global",
		"-E",
		"--save-exact",
		"--exact",
		"-O",
		"--save-optional",
		"--optional",
		"-P",
		"--save-peer",
		"--peer",
		"--frozen-lockfile",
	]);
	const unknownFlags = flags.rawFlags.filter((f) => !knownFlags.has(f));

	const findFlag = (variants: string[], fallback: string): string => {
		// For npm/pnpm, preserve the original flag format
		if (manager === "npm" || manager === "pnpm") {
			for (const variant of variants) {
				if (flags.rawFlags.includes(variant)) {
					return variant;
				}
			}
		}
		// For yarn/bun, always normalize to npm-style short flags
		return fallback;
	};

	type FlagConfig = {
		enabled: boolean;
		variants: string[];
		fallback: string;
		npm?: string;
		pnpm?: string;
		yarn?: string;
		bun?: string;
	};

	const flagConfigs: FlagConfig[] = [
		{
			enabled: flags.dev,
			variants: ["-D", "--save-dev", "--dev", "-d"],
			fallback: "-D",
			yarn: "--dev",
			bun: "--dev",
		},
		{
			enabled: flags.global,
			variants: ["-g", "--global"],
			fallback: "-g",
			bun: "-g",
		},
		{
			enabled: flags.exact,
			variants: ["-E", "--save-exact", "--exact"],
			fallback: "-E",
			yarn: "--exact",
			bun: "--exact",
		},
		{
			enabled: flags.optional,
			variants: ["-O", "--save-optional", "--optional"],
			fallback: "-O",
		},
		{
			enabled: flags.peer,
			variants: ["-P", "--save-peer", "--peer"],
			fallback: "-P",
		},
	];

	flagConfigs.forEach((config) => {
		if (config.enabled) {
			const originalFlag = findFlag(config.variants, config.fallback);
			npmParts.push(config.npm || originalFlag);
			pnpmParts.push(config.pnpm || originalFlag);
			if (config.yarn) yarnParts.push(config.yarn);
			if (config.bun) bunParts.push(config.bun);
		}
	});

	if (flags.frozen) {
		npmParts.push("--frozen-lockfile");
		pnpmParts.push("--frozen-lockfile");
		if (!hasPackages) {
			yarnParts.push("--frozen-lockfile");
		}
	}

	unknownFlags.forEach((flag) => {
		npmParts.push(flag);
		pnpmParts.push(flag);
	});

	npmParts.push(...packages);
	pnpmParts.push(...packages);
	yarnParts.push(...packages);
	bunParts.push(...packages);

	return {
		ok: true,
		npm: npmParts.join(" "),
		pnpm: pnpmParts.join(" "),
		yarn: yarnParts.join(" "),
		bun: bunParts.join(" "),
		meta: {
			manager,
			packages,
			dev: flags.dev,
			global: flags.global,
			exact: flags.exact,
			optional: flags.optional,
			peer: flags.peer,
			frozen: flags.frozen,
			unknownFlags,
		},
	};
}

export function packmorph(command: string): PackmorphResult {
	const parsed = parseCommand(command);

	if ("ok" in parsed && !parsed.ok) {
		return parsed;
	}

	return generateCommands(parsed as ParsedCommand);
}

export default packmorph;
