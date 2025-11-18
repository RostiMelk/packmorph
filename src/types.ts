export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type CommandType = "install" | "exec" | "run" | "create";

export interface PackmorphOptions {
	/**
	 * Enable parsing of install/add commands (npm install, pnpm add, etc.)
	 * @default true
	 */
	parseInstall?: boolean;

	/**
	 * Enable parsing of exec commands (npx, pnpm dlx, yarn dlx, bunx)
	 * @default false
	 */
	parseExec?: boolean;

	/**
	 * Enable parsing of run commands (npm run, pnpm run, etc.)
	 * @default false
	 */
	parseRun?: boolean;

	/**
	 * Enable parsing of create commands (npm create, pnpm create, etc.)
	 * @default false
	 */
	parseCreate?: boolean;

	/**
	 * Enable multi-line command parsing (handles code blocks with multiple commands)
	 * @default false
	 */
	parseMultiLine?: boolean;
}

export interface CommandMeta {
	type: CommandType;
	manager: PackageManager;
	packages: string[];
	dev: boolean;
	global: boolean;
	exact: boolean;
	optional: boolean;
	peer: boolean;
	frozen: boolean;
	unknownFlags: string[];
}

export interface ExecMeta {
	type: "exec";
	manager: PackageManager;
	package: string;
	args: string[];
	flags: string[];
}

export interface RunMeta {
	type: "run";
	manager: PackageManager;
	script: string;
	args: string[];
}

export interface CreateMeta {
	type: "create";
	manager: PackageManager;
	template: string;
	additionalArgs: string[];
}

export interface InstallSuccessResult {
	ok: true;
	type: "install";
	npm: string;
	pnpm: string;
	yarn: string;
	bun: string;
	meta: CommandMeta;
}

export interface ExecSuccessResult {
	ok: true;
	type: "exec";
	npm: string;
	pnpm: string;
	yarn: string;
	bun: string;
	meta: ExecMeta;
}

export interface RunSuccessResult {
	ok: true;
	type: "run";
	npm: string;
	pnpm: string;
	yarn: string;
	bun: string;
	meta: RunMeta;
}

export interface CreateSuccessResult {
	ok: true;
	type: "create";
	npm: string;
	pnpm: string;
	yarn: string;
	bun: string;
	meta: CreateMeta;
}

export type SuccessResult =
	| InstallSuccessResult
	| ExecSuccessResult
	| RunSuccessResult
	| CreateSuccessResult;

export interface ErrorResult {
	ok: false;
	reason:
		| "not-supported-command"
		| "parse-error"
		| "disabled-command-type"
		| "not-install-command"
		| "mixed-package-managers";
}

export type PackmorphResult = SuccessResult | ErrorResult;

export interface ParsedInstallCommand {
	type: "install";
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

export interface ParsedExecCommand {
	type: "exec";
	manager: PackageManager;
	package: string;
	args: string[];
	flags: string[];
}

export interface ParsedRunCommand {
	type: "run";
	manager: PackageManager;
	script: string;
	args: string[];
}

export interface ParsedCreateCommand {
	type: "create";
	manager: PackageManager;
	template: string;
	additionalArgs: string[];
	hasDoubleDashSeparator: boolean;
}

export type ParsedCommand =
	| ParsedInstallCommand
	| ParsedExecCommand
	| ParsedRunCommand
	| ParsedCreateCommand;
