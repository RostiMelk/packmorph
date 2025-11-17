export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface CommandMeta {
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

export interface SuccessResult {
  ok: true;
  npm: string;
  pnpm: string;
  yarn: string;
  bun: string;
  meta: CommandMeta;
}

export interface ErrorResult {
  ok: false;
  reason: "not-install-command" | "parse-error";
}

export type PackmorphResult = SuccessResult | ErrorResult;
