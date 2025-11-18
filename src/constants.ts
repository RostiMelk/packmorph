export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

export const INVALID_COMMAND_PATTERNS = {
	STANDARD: /[;\n]|&&|\|\||(\(.*\)(?!\s*(npm|pnpm|yarn|bun)))/,
	EXEC: /[;\n]|&&|\|\||(\(.*\)(?!\s*(npx|pnpm|yarn|bunx)))/,
} as const;

export const KNOWN_INSTALL_FLAGS = new Set([
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

export const FLAG_MAP = {
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
} as const;
