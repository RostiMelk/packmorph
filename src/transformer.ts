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
		const packages = ast.packages.map((p) => p.value);
		const hasPackages = packages.length > 0;

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
		const packageName = ast.package.value;
		const args = ast.args.map((a) => a.value);
		const flags = ast.flags.map((f) => f.value);

		const npmParts = ["npx", ...flags, packageName, ...args];
		const pnpmParts = ["pnpm", "dlx", ...flags, packageName, ...args];
		const yarnParts = ["yarn", "dlx", ...flags, packageName, ...args];
		const bunParts = ["bunx", ...flags, packageName, ...args];

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
				package: packageName,
				args,
				flags,
			},
		};
	}

	private transformRunCommand(ast: RunCommandNode): RunSuccessResult {
		const manager = ast.manager.value;
		const script = ast.script.value;
		const args = ast.args.map((a) => a.value);

		const npmParts = ["npm", "run", script, ...args];
		const pnpmParts = ["pnpm", "run", script, ...args];
		const yarnParts = ["yarn", "run", script, ...args];
		const bunParts = ["bun", "run", script, ...args];

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
				script,
				args,
			},
		};
	}

	private transformCreateCommand(ast: CreateCommandNode): CreateSuccessResult {
		const manager = ast.manager.value;
		const template = ast.template.value;
		const additionalArgs = ast.additionalArgs.map((a) => a.value);

		const npmParts = ["npm", "create", template];
		const pnpmParts = ["pnpm", "create", template];
		const yarnParts = ["yarn", "create", template];
		const bunParts = ["bun", "create", template];

		// npm requires -- separator before additional args
		if (additionalArgs.length > 0) {
			// If input had separator, preserve it; otherwise add it for npm
			if (ast.hasSeparator || !ast.hasSeparator) {
				npmParts.push("--");
			}
			npmParts.push(...additionalArgs);
			pnpmParts.push(...additionalArgs);
			yarnParts.push(...additionalArgs);
			bunParts.push(...additionalArgs);
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
				template,
				additionalArgs,
			},
		};
	}
}
