import type {
	CommandNode,
	CreateCommandNode,
	ExecCommandNode,
	InstallCommandNode,
	RunCommandNode,
} from "./ast.js";
import type {
	CreateSuccessResult,
	ExecSuccessResult,
	InstallSuccessResult,
	RunSuccessResult,
	SuccessResult,
} from "./types.js";
import { quoteArgument } from "./utils.js";

export class Transformer {
	transform(ast: CommandNode): SuccessResult {
		switch (ast.type) {
			case "InstallCommand":
				return this.transformInstallCommand(ast);
			case "ExecCommand":
				return this.transformExecCommand(ast);
			case "RunCommand":
				return this.transformRunCommand(ast);
			case "CreateCommand":
				return this.transformCreateCommand(ast);
		}
	}

	private transformInstallCommand(
		ast: InstallCommandNode,
	): InstallSuccessResult {
		const manager = ast.manager.value;
		const packagesRaw = ast.packages.map((p) => p.value);
		const packagesQuoted = ast.packages.map((p) =>
			quoteArgument(
				p.value,
				p.type === "Argument" ? p.wasQuoted : undefined,
				p.type === "Argument" ? p.quoteChar : undefined,
			),
		);
		const hasPackages = packagesRaw.length > 0;

		const flagState = {
			dev: false,
			global: false,
			exact: false,
			optional: false,
			peer: false,
			frozen: false,
		};

		const rawFlags: string[] = [];
		const unknownFlags: string[] = [];

		for (const flag of ast.flags) {
			rawFlags.push(flag.value);
			if (flag.category === "unknown") {
				unknownFlags.push(flag.value);
			} else {
				flagState[flag.category] = true;
			}
		}

		const npmParts: string[] = ["npm", "install"];
		const pnpmParts: string[] = hasPackages
			? ["pnpm", "add"]
			: ["pnpm", "install"];
		const yarnParts: string[] = [];
		const bunParts: string[] = hasPackages
			? ["bun", "add"]
			: ["bun", "install"];

		if (flagState.global) {
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

		const findFlag = (variants: string[], fallback: string): string => {
			if (manager === "npm" || manager === "pnpm") {
				for (const variant of variants) {
					if (rawFlags.includes(variant)) {
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
				enabled: flagState.dev,
				variants: ["-D", "--save-dev", "--dev", "-d"],
				fallback: "-D",
				yarn: "--dev",
				bun: "--dev",
			},
			{
				enabled: flagState.global,
				variants: ["-g", "--global"],
				fallback: "-g",
				bun: "-g",
			},
			{
				enabled: flagState.exact,
				variants: ["-E", "--save-exact", "--exact"],
				fallback: "-E",
				yarn: "--exact",
				bun: "--exact",
			},
			{
				enabled: flagState.optional,
				variants: ["-O", "--save-optional", "--optional"],
				fallback: "-O",
			},
			{
				enabled: flagState.peer,
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

		if (flagState.frozen) {
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

		npmParts.push(...packagesQuoted);
		pnpmParts.push(...packagesQuoted);
		yarnParts.push(...packagesQuoted);
		bunParts.push(...packagesQuoted);

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
				packages: packagesRaw,
				dev: flagState.dev,
				global: flagState.global,
				exact: flagState.exact,
				optional: flagState.optional,
				peer: flagState.peer,
				frozen: flagState.frozen,
				unknownFlags,
			},
		};
	}

	private transformExecCommand(ast: ExecCommandNode): ExecSuccessResult {
		const manager = ast.manager.value;
		const packageNameRaw = ast.package.value;
		const packageNameQuoted = quoteArgument(
			ast.package.value,
			ast.package.wasQuoted,
			ast.package.quoteChar,
		);
		const argsRaw = ast.args.map((a) => a.value);
		const argsQuoted = ast.args.map((a) =>
			quoteArgument(a.value, a.wasQuoted, a.quoteChar),
		);
		const flags = ast.flags.map((f) => f.value);

		const npmParts = ["npx", ...flags, packageNameQuoted, ...argsQuoted];
		const pnpmParts = [
			"pnpm",
			"dlx",
			...flags,
			packageNameQuoted,
			...argsQuoted,
		];
		const yarnParts = [
			"yarn",
			"dlx",
			...flags,
			packageNameQuoted,
			...argsQuoted,
		];
		const bunParts = ["bunx", ...flags, packageNameQuoted, ...argsQuoted];

		return {
			ok: true,
			type: "exec",
			npm: npmParts.join(" "),
			pnpm: pnpmParts.join(" "),
			yarn: yarnParts.join(" "),
			bun: bunParts.join(" "),
			meta: {
				type: "exec",
				manager,
				package: packageNameRaw,
				args: argsRaw,
				flags,
			},
		};
	}

	private transformRunCommand(ast: RunCommandNode): RunSuccessResult {
		const manager = ast.manager.value;
		const scriptRaw = ast.script.value;
		const scriptQuoted = quoteArgument(
			ast.script.value,
			ast.script.wasQuoted,
			ast.script.quoteChar,
		);
		const argsRaw = ast.args.map((a) => a.value);
		const argsQuoted = ast.args.map((a) =>
			quoteArgument(a.value, a.wasQuoted, a.quoteChar),
		);

		const npmParts = ["npm", "run", scriptQuoted, ...argsQuoted];
		const pnpmParts = ["pnpm", "run", scriptQuoted, ...argsQuoted];
		const yarnParts = ["yarn", "run", scriptQuoted, ...argsQuoted];
		const bunParts = ["bun", "run", scriptQuoted, ...argsQuoted];

		return {
			ok: true,
			type: "run",
			npm: npmParts.join(" "),
			pnpm: pnpmParts.join(" "),
			yarn: yarnParts.join(" "),
			bun: bunParts.join(" "),
			meta: {
				type: "run",
				manager,
				script: scriptRaw,
				args: argsRaw,
			},
		};
	}

	private transformCreateCommand(ast: CreateCommandNode): CreateSuccessResult {
		const manager = ast.manager.value;
		const templateRaw = ast.template.value;
		const templateQuoted = quoteArgument(
			ast.template.value,
			ast.template.wasQuoted,
			ast.template.quoteChar,
		);
		const additionalArgsRaw = ast.additionalArgs.map((a) => a.value);
		const additionalArgsQuoted = ast.additionalArgs.map((a) =>
			quoteArgument(a.value, a.wasQuoted, a.quoteChar),
		);

		const npmParts = ["npm", "create", templateQuoted];
		const pnpmParts = ["pnpm", "create", templateQuoted];
		const yarnParts = ["yarn", "create", templateQuoted];
		const bunParts = ["bun", "create", templateQuoted];

		// npm requires -- separator before additional args
		if (additionalArgsQuoted.length > 0) {
			// If input had separator, preserve it; otherwise add it for npm
			if (ast.hasSeparator || !ast.hasSeparator) {
				npmParts.push("--");
			}
			npmParts.push(...additionalArgsQuoted);
			pnpmParts.push(...additionalArgsQuoted);
			yarnParts.push(...additionalArgsQuoted);
			bunParts.push(...additionalArgsQuoted);
		} else if (ast.hasSeparator) {
			// If there was a separator but no args, preserve it for npm
			npmParts.push("--");
		}

		return {
			ok: true,
			type: "create",
			npm: npmParts.join(" "),
			pnpm: pnpmParts.join(" "),
			yarn: yarnParts.join(" "),
			bun: bunParts.join(" "),
			meta: {
				type: "create",
				manager,
				template: templateRaw,
				additionalArgs: additionalArgsRaw,
			},
		};
	}
}
