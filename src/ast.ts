export interface ASTNode {
	type: string;
	start: number;
	end: number;
}

export interface PackageManagerNode extends ASTNode {
	type: "PackageManager";
	value: "npm" | "pnpm" | "yarn" | "bun";
}

export interface SubcommandNode extends ASTNode {
	type: "Subcommand";
	value: string;
}

export interface FlagNode extends ASTNode {
	type: "Flag";
	value: string;
	category:
		| "dev"
		| "global"
		| "exact"
		| "optional"
		| "peer"
		| "frozen"
		| "unknown";
}

export interface PackageNode extends ASTNode {
	type: "Package";
	value: string;
	scope?: string;
	version?: string;
}

export interface ArgumentNode extends ASTNode {
	type: "Argument";
	value: string;
}

export interface SeparatorNode extends ASTNode {
	type: "Separator";
	value: "--";
}

export interface InstallCommandNode extends ASTNode {
	type: "InstallCommand";
	manager: PackageManagerNode;
	subcommand: SubcommandNode;
	flags: FlagNode[];
	packages: (PackageNode | ArgumentNode)[];
	hasSeparator: boolean;
}

export interface ExecCommandNode extends ASTNode {
	type: "ExecCommand";
	manager: PackageManagerNode;
	subcommand?: SubcommandNode;
	flags: FlagNode[];
	package: ArgumentNode;
	args: ArgumentNode[];
}

export interface RunCommandNode extends ASTNode {
	type: "RunCommand";
	manager: PackageManagerNode;
	subcommand: SubcommandNode;
	script: ArgumentNode;
	args: ArgumentNode[];
}

export interface CreateCommandNode extends ASTNode {
	type: "CreateCommand";
	manager: PackageManagerNode;
	subcommand: SubcommandNode;
	template: ArgumentNode;
	additionalArgs: ArgumentNode[];
	hasSeparator: boolean;
}

export type CommandNode =
	| InstallCommandNode
	| ExecCommandNode
	| RunCommandNode
	| CreateCommandNode;
