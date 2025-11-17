import type { ExecSuccessResult, ParsedExecCommand } from "../types.js";

export function generateExecCommands(
	parsed: ParsedExecCommand,
): ExecSuccessResult {
	const { manager, package: pkg, args, flags } = parsed;

	const npmParts = ["npx", ...flags, pkg, ...args];
	const pnpmParts = ["pnpm", "dlx", ...flags, pkg, ...args];
	const yarnParts = ["yarn", "dlx", ...flags, pkg, ...args];
	const bunParts = ["bunx", ...flags, pkg, ...args];

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
			package: pkg,
			args,
			flags,
		},
	};
}
