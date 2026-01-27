import type {
	ArgumentNode,
	CommandNode,
	CreateCommandNode,
	ExecCommandNode,
	FlagNode,
	InstallCommandNode,
	PackageManagerNode,
	RunCommandNode,
	SubcommandNode,
} from "./ast.js";
import { FLAG_MAP, PACKAGE_MANAGERS } from "./constants.js";
import type { Token } from "./lexer.js";
import type { ErrorResult, PackageManager } from "./types.js";

export class Parser {
	private tokens: Token[];
	private current: number;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.current = 0;
	}

	parse(): CommandNode | ErrorResult {
		if (this.tokens.length === 0 || this.isAtEnd()) {
			return { ok: false, reason: "not-supported-command" };
		}

		const manager = this.parsePackageManager();
		if (!manager) {
			return { ok: false, reason: "not-supported-command" };
		}

		if (this.isAtEnd()) {
			return { ok: false, reason: "parse-error" };
		}

		// Handle exec commands (npx, bunx, etc.)
		if (manager.value === "npm" && this.tokens[0]?.value === "npx") {
			return this.parseExecCommand(manager);
		}
		if (manager.value === "bun" && this.tokens[0]?.value === "bunx") {
			return this.parseExecCommand(manager);
		}

		const subcommand = this.parseSubcommand();
		if (!subcommand) {
			return { ok: false, reason: "not-supported-command" };
		}

		// Route to appropriate parser based on subcommand
		if (subcommand.value === "dlx") {
			return this.parseExecCommand(manager, subcommand);
		}

		if (
			subcommand.value === "install" ||
			subcommand.value === "i" ||
			subcommand.value === "add"
		) {
			return this.parseInstallCommand(manager, subcommand);
		}

		if (subcommand.value === "run") {
			return this.parseRunCommand(manager, subcommand);
		}

		if (subcommand.value === "create") {
			return this.parseCreateCommand(manager, subcommand);
		}

		// Handle yarn global add
		if (manager.value === "yarn" && subcommand.value === "global") {
			return this.parseYarnGlobalAdd(manager, subcommand);
		}

		return { ok: false, reason: "not-supported-command" };
	}

	private parsePackageManager(): PackageManagerNode | null {
		const token = this.peek();
		if (!token || token.type === "EOF") return null;

		const value = token.value;
		if (
			value === "npx" ||
			value === "bunx" ||
			PACKAGE_MANAGERS.includes(value as PackageManager)
		) {
			this.advance();
			return {
				type: "PackageManager",
				value:
					value === "npx"
						? "npm"
						: value === "bunx"
							? "bun"
							: (value as "npm" | "pnpm" | "yarn" | "bun"),
				start: token.start,
				end: token.end,
			};
		}

		return null;
	}

	private parseSubcommand(): SubcommandNode | null {
		const token = this.peek();
		if (!token || token.type === "EOF") return null;

		this.advance();
		return {
			type: "Subcommand",
			value: token.value,
			start: token.start,
			end: token.end,
		};
	}

	private parseInstallCommand(
		manager: PackageManagerNode,
		subcommand: SubcommandNode,
	): InstallCommandNode | ErrorResult {
		const start = manager.start;
		const flags: FlagNode[] = [];
		const packages: ArgumentNode[] = [];
		let hasSeparator = false;

		while (!this.isAtEnd()) {
			const token = this.peek();
			if (!token || token.type === "EOF") break;

			if (token.type === "SEPARATOR") {
				hasSeparator = true;
				this.advance();
				// Check if there are any tokens after separator
				if (this.isAtEnd()) {
					return { ok: false, reason: "parse-error" };
				}
				continue;
			}

			if (token.type === "FLAG") {
				flags.push(this.parseFlag());
			} else {
				packages.push(this.parseArgument());
			}
		}

		return {
			type: "InstallCommand",
			manager,
			subcommand,
			flags,
			packages,
			hasSeparator,
			start,
			end: this.tokens[this.current - 1]?.end || start,
		};
	}

	private parseYarnGlobalAdd(
		manager: PackageManagerNode,
		globalSubcommand: SubcommandNode,
	): InstallCommandNode | ErrorResult {
		// yarn global add ...
		const addToken = this.peek();
		if (!addToken || addToken.value !== "add") {
			return { ok: false, reason: "not-supported-command" };
		}

		const addSubcommand = this.parseSubcommand();
		if (!addSubcommand) {
			return { ok: false, reason: "not-supported-command" };
		}

		const start = manager.start;
		const flags: FlagNode[] = [];
		const packages: ArgumentNode[] = [];
		let hasSeparator = false;

		// Add a global flag
		flags.push({
			type: "Flag",
			value: "--global",
			category: "global",
			start: globalSubcommand.start,
			end: globalSubcommand.end,
		});

		while (!this.isAtEnd()) {
			const token = this.peek();
			if (!token || token.type === "EOF") break;

			if (token.type === "SEPARATOR") {
				hasSeparator = true;
				this.advance();
				if (this.isAtEnd()) {
					return { ok: false, reason: "parse-error" };
				}
				continue;
			}

			if (token.type === "FLAG") {
				flags.push(this.parseFlag());
			} else {
				packages.push(this.parseArgument());
			}
		}

		return {
			type: "InstallCommand",
			manager,
			subcommand: addSubcommand,
			flags,
			packages,
			hasSeparator,
			start,
			end: this.tokens[this.current - 1]?.end || start,
		};
	}

	private parseExecCommand(
		manager: PackageManagerNode,
		subcommand?: SubcommandNode,
	): ExecCommandNode | ErrorResult {
		const start = manager.start;
		const flags: FlagNode[] = [];
		const args: ArgumentNode[] = [];
		let packageArg: ArgumentNode | null = null;

		while (!this.isAtEnd()) {
			const token = this.peek();
			if (!token || token.type === "EOF") break;

			if (token.type === "FLAG") {
				// Flags before package name
				if (!packageArg) {
					flags.push(this.parseFlag());
				} else {
					// Arguments after package name
					args.push(this.parseArgument());
				}
			} else {
				if (!packageArg) {
					packageArg = this.parseArgument();
				} else {
					args.push(this.parseArgument());
				}
			}
		}

		if (!packageArg) {
			return { ok: false, reason: "parse-error" };
		}

		return {
			type: "ExecCommand",
			manager,
			subcommand,
			flags,
			package: packageArg,
			args,
			start,
			end: this.tokens[this.current - 1]?.end || start,
		};
	}

	private parseRunCommand(
		manager: PackageManagerNode,
		subcommand: SubcommandNode,
	): RunCommandNode | ErrorResult {
		const start = manager.start;

		if (this.isAtEnd()) {
			return { ok: false, reason: "parse-error" };
		}

		const script = this.parseArgument();
		const args: ArgumentNode[] = [];

		while (!this.isAtEnd()) {
			const token = this.peek();
			if (!token || token.type === "EOF") break;
			args.push(this.parseArgument());
		}

		return {
			type: "RunCommand",
			manager,
			subcommand,
			script,
			args,
			start,
			end: this.tokens[this.current - 1]?.end || start,
		};
	}

	private parseCreateCommand(
		manager: PackageManagerNode,
		subcommand: SubcommandNode,
	): CreateCommandNode | ErrorResult {
		const start = manager.start;

		if (this.isAtEnd()) {
			return { ok: false, reason: "parse-error" };
		}

		const template = this.parseArgument();
		const additionalArgs: ArgumentNode[] = [];
		let hasSeparator = false;

		while (!this.isAtEnd()) {
			const token = this.peek();
			if (!token || token.type === "EOF") break;

			if (token.type === "SEPARATOR") {
				hasSeparator = true;
				this.advance();
				continue;
			}

			additionalArgs.push(this.parseArgument());
		}

		return {
			type: "CreateCommand",
			manager,
			subcommand,
			template,
			additionalArgs,
			hasSeparator,
			start,
			end: this.tokens[this.current - 1]?.end || start,
		};
	}

	private parseFlag(): FlagNode {
		const token = this.advance();
		const category = this.categorizeFl(token.value);

		return {
			type: "Flag",
			value: token.value,
			category,
			start: token.start,
			end: token.end,
		};
	}

	private parseArgument(): ArgumentNode {
		const token = this.advance();

		return {
			type: "Argument",
			value: token.value,
			start: token.start,
			end: token.end,
			wasQuoted: token.wasQuoted,
			quoteChar: token.quoteChar,
		};
	}

	private categorizeFl(flag: string): FlagNode["category"] {
		const mapped = FLAG_MAP[flag as keyof typeof FLAG_MAP];
		return mapped || "unknown";
	}

	private peek(): Token {
		return (
			this.tokens[this.current] || { type: "EOF", value: "", start: 0, end: 0 }
		);
	}

	private advance(): Token {
		if (!this.isAtEnd()) {
			this.current++;
		}
		return (
			this.tokens[this.current - 1] || {
				type: "EOF",
				value: "",
				start: 0,
				end: 0,
			}
		);
	}

	private isAtEnd(): boolean {
		return this.current >= this.tokens.length || this.peek()?.type === "EOF";
	}
}
