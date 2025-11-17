# packmorph

Translate package manager commands between npm, pnpm, Yarn, and Bun.

[![npm version](https://badge.fury.io/js/packmorph.svg)](https://badge.fury.io/js/packmorph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```typescript
import { packmorph } from "packmorph";

// Install commands (default)
const result = packmorph("npm install -D typescript");
if (result.ok) {
  console.log(result.npm); // npm install -D typescript
  console.log(result.pnpm); // pnpm add -D typescript
  console.log(result.yarn); // yarn add --dev typescript
  console.log(result.bun); // bun add --dev typescript
}
```

## Install

```bash
npm install packmorph
```

## What it does

Converts package manager commands between npm, pnpm, Yarn, and Bun. Supports install, exec, run, and create commands.

## Command Types

### Install (default)

```typescript
packmorph("npm install react");
packmorph("pnpm add -D vitest");
packmorph("yarn global add eslint");
packmorph("bun add --exact lodash");
```

### Exec (opt-in)

```typescript
packmorph("npx prettier .", { parseExec: true });
// → npm: npx prettier .
// → pnpm: pnpm dlx prettier .
// → yarn: yarn dlx prettier .
// → bun: bunx prettier .
```

### Run (opt-in)

```typescript
packmorph("npm run dev", { parseRun: true });
// → npm: npm run dev
// → pnpm: pnpm run dev
// → yarn: yarn run dev
// → bun: bun run dev
```

### Create (opt-in)

```typescript
packmorph("npm create vite@latest my-app", { parseCreate: true });
// → npm: npm create vite@latest -- my-app
// → pnpm: pnpm create vite@latest my-app
// → yarn: yarn create vite@latest my-app
// → bun: bun create vite@latest my-app
```

**Note:** `npm create` requires `--` before additional args. Packmorph handles this automatically.

### Multi-line (opt-in)

```typescript
packmorph(
  `
  # Install dependencies
  npm install react
  npm install -D typescript
  npx prettier --write .
`,
  { parseMultiLine: true, parseExec: true },
);
// → { ok: true, commands: [
//     { original: "npm install react", result: {...} },
//     { original: "npm install -D typescript", result: {...} },
//     { original: "npx prettier --write .", result: {...} }
//   ] }
```

**Note:** The `commands` array only contains lines that were successfully parsed as package manager commands. Comments (`#`), empty lines, and non-package-manager commands (like `cd`, `mkdir`, `echo`) are skipped in the returned array.

**Preserving all lines:** If you need to preserve non-package-manager commands in your output, match each line against the parsed commands:

```typescript
const input = `
# Install dependencies
npm install react
cd my-project
npm run dev
`;

const result = packmorph(input, {
  parseMultiLine: true,
  parseInstall: true,
  parseRun: true,
});

if (result.ok && "commands" in result) {
  // Create a map for quick lookup
  const commandMap = new Map(
    result.commands
      .filter((cmd) => cmd.result.ok)
      .map((cmd) => [cmd.original, cmd.result]),
  );

  // Process each line
  const npmLines = [];
  const pnpmLines = [];

  for (const line of input.split("\n")) {
    const trimmed = line.trim();
    const parsed = commandMap.get(trimmed);

    if (parsed && parsed.ok) {
      // Line was parsed - use transformed commands
      npmLines.push(parsed.npm);
      pnpmLines.push(parsed.pnpm);
    } else {
      // Line wasn't parsed - preserve as-is
      npmLines.push(line);
      pnpmLines.push(line);
    }
  }

  console.log(npmLines.join("\n"));
  // # Install dependencies
  // npm install react
  // cd my-project
  // npm run dev

  console.log(pnpmLines.join("\n"));
  // # Install dependencies
  // pnpm add react
  // cd my-project
  // pnpm run dev
}
```

**Important:** Multi-line parsing requires all package manager commands to use the **same package manager**. Mixing different package managers will return an error:

```typescript
packmorph(
  `
  npm install react
  pnpm add typescript
`,
  { parseMultiLine: true },
);
// → { ok: false, reason: "mixed-package-managers" }
```

This ensures consistent command conversion across all package managers (npm → pnpm, yarn, bun).

## Options

```typescript
interface PackmorphOptions {
  parseInstall?: boolean; // default: true
  parseExec?: boolean; // default: false
  parseRun?: boolean; // default: false
  parseCreate?: boolean; // default: false
  parseMultiLine?: boolean; // default: false
}
```

Enable multiple command types:

```typescript
const result = packmorph(command, {
  parseInstall: true,
  parseExec: true,
  parseRun: true,
  parseCreate: true,
  parseMultiLine: true,
});
```

## Supported Commands

### Install

- `npm install` / `npm i`
- `pnpm add` / `pnpm install`
- `yarn add` / `yarn install` / `yarn global add`
- `bun add` / `bun install`

### Exec

- `npx <package>`
- `pnpm dlx <package>`
- `yarn dlx <package>`
- `bunx <package>`

### Run

- `npm run <script>`
- `pnpm run <script>`
- `yarn run <script>`
- `bun run <script>`

### Create

- `npm create <template>`
- `pnpm create <template>`
- `yarn create <template>`
- `bun create <template>`

## Flags

Install commands support: `-D` (dev), `-g` (global), `-E` (exact), `-O` (optional), `-P` (peer), `--frozen-lockfile`.

Flags are automatically normalized:

- `yarn add --dev` → `npm install -D`
- `bun add -d` → `npm install -D`
- `yarn add --exact` → `npm install -E`

## API

```typescript
packmorph(command: string, options?: PackmorphOptions): PackmorphResult
```

**Success:**

```typescript
{
  ok: true,
  type: "install" | "exec" | "run" | "create",
  npm: string,
  pnpm: string,
  yarn: string,
  bun: string,
  meta: { /* command-specific metadata */ }
}
```

**Error:**

```typescript
{
  ok: false,
  reason: "not-install-command" | "parse-error" | "not-supported-command" | "disabled-command-type" | "mixed-package-managers"
}
```

**Multi-line Success:**

```typescript
{
  ok: true,
  commands: Array<{
    original: string,
    result: PackmorphResult
  }>
}
```

## License

MIT
