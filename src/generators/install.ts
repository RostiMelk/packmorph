import type { InstallSuccessResult, ParsedInstallCommand } from "../types.js";

export function generateInstallCommands(
	parsed: ParsedInstallCommand,
): InstallSuccessResult {
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
		if (manager === "npm" || manager === "pnpm") {
			for (const variant of variants) {
				if (flags.rawFlags.includes(variant)) {
					return variant;
				}
			}
		}
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
		type: "install",
		npm: npmParts.join(" "),
		pnpm: pnpmParts.join(" "),
		yarn: yarnParts.join(" "),
		bun: bunParts.join(" "),
		meta: {
			type: "install",
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
