import type { CreateSuccessResult, ParsedCreateCommand } from "../types.js";

export function generateCreateCommands(
	parsed: ParsedCreateCommand,
): CreateSuccessResult {
	const { manager, template, additionalArgs } = parsed;

	// npm create requires -- separator before any additional args/flags
	// pnpm/yarn/bun can take them directly
	const hasAdditionalArgs = additionalArgs.length > 0;

	const npmParts = ["npm", "create", template];
	if (hasAdditionalArgs) {
		npmParts.push("--", ...additionalArgs);
	}

	const pnpmParts = ["pnpm", "create", template, ...additionalArgs];
	const yarnParts = ["yarn", "create", template, ...additionalArgs];
	const bunParts = ["bun", "create", template, ...additionalArgs];

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
