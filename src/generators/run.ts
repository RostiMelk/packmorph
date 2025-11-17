import type { ParsedRunCommand, RunSuccessResult } from "../types.js";

export function generateRunCommands(
	parsed: ParsedRunCommand,
): RunSuccessResult {
	const { manager, script, args } = parsed;

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
