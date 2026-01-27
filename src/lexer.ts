export type TokenType =
	| "PACKAGE_MANAGER"
	| "SUBCOMMAND"
	| "FLAG"
	| "PACKAGE"
	| "ARGUMENT"
	| "SEPARATOR"
	| "WHITESPACE"
	| "EOF";

export interface Token {
	type: TokenType;
	value: string;
	start: number;
	end: number;
	wasQuoted?: boolean;
	quoteChar?: '"' | "'";
}

export class Lexer {
	private input: string;
	private position: number;
	private tokens: Token[];

	constructor(input: string) {
		this.input = input;
		this.position = 0;
		this.tokens = [];
	}

	tokenize(): Token[] {
		while (this.position < this.input.length) {
			this.skipWhitespace();
			if (this.position >= this.input.length) break;

			const token = this.nextToken();
			if (token) {
				this.tokens.push(token);
			}
		}

		this.tokens.push({
			type: "EOF",
			value: "",
			start: this.position,
			end: this.position,
		});

		return this.tokens;
	}

	private nextToken(): Token | null {
		const start = this.position;
		const char = this.input[this.position];

		if (!char) return null;

		// Handle double dash separator
		if (char === "-" && this.input[this.position + 1] === "-") {
			const peek = this.input[this.position + 2];
			// Check if it's just "--" (separator) or a flag like "--save-dev"
			if (peek === undefined || peek === " " || peek === "\t") {
				this.position += 2;
				return {
					type: "SEPARATOR",
					value: "--",
					start,
					end: this.position,
				};
			}
		}

		// Handle flags (-, --, or combinations)
		if (char === "-") {
			return this.readFlag(start);
		}

		// Handle quoted strings
		if (char === '"' || char === "'") {
			return this.readQuotedString(start, char);
		}

		// Handle regular arguments/packages
		return this.readWord(start);
	}

	private readFlag(start: number): Token {
		let value = "";

		while (this.position < this.input.length) {
			const char = this.input[this.position];
			if (char === " " || char === "\t" || char === "\n") {
				break;
			}
			value += char;
			this.position++;
		}

		return {
			type: "FLAG",
			value,
			start,
			end: this.position,
		};
	}

	private readQuotedString(start: number, quote: string): Token {
		let value = "";
		this.position++; // Skip opening quote

		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (char === "\\") {
				// Handle escape sequences
				this.position++;
				if (this.position < this.input.length) {
					value += this.input[this.position];
					this.position++;
				}
				continue;
			}

			if (char === quote) {
				this.position++; // Skip closing quote
				break;
			}

			value += char;
			this.position++;
		}

		return {
			type: "ARGUMENT",
			value,
			start,
			end: this.position,
			wasQuoted: true,
			quoteChar: quote as '"' | "'",
		};
	}

	private readWord(start: number): Token {
		let value = "";

		while (this.position < this.input.length) {
			const char = this.input[this.position];

			// Stop at whitespace
			if (char === " " || char === "\t" || char === "\n") {
				break;
			}

			value += char;
			this.position++;
		}

		return {
			type: "ARGUMENT",
			value,
			start,
			end: this.position,
		};
	}

	private skipWhitespace(): void {
		while (this.position < this.input.length) {
			const char = this.input[this.position];
			if (char !== " " && char !== "\t" && char !== "\n" && char !== "\r") {
				break;
			}
			this.position++;
		}
	}
}
