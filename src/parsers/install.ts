import type {
	ErrorResult,
	PackageManager,
	ParsedInstallCommand,
} from "../types.js";

export function parseInstallCommand(
	command: string,
): ParsedInstallCommand | ErrorResult {
	const trimmed = command.trim();

	if (!trimmed) {
		return { ok: false, reason: "not-install-command" };
	}

	// Reject code blocks with surrounding code
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
		type: "install",
		manager,
		packages,
		flags: {
			...flagState,
			rawFlags,
		},
	};
}
