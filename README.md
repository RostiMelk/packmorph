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

## Options

```typescript
interface PackmorphOptions {
  parseInstall?: boolean; // default: true
  parseExec?: boolean; // default: false
  parseRun?: boolean; // default: false
  parseCreate?: boolean; // default: false
}
```

Enable multiple command types:

```typescript
const result = packmorph(command, {
  parseInstall: true,
  parseExec: true,
  parseRun: true,
  parseCreate: true,
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
  reason: "not-install-command" | "parse-error" | "not-supported-command"
}
```

## License

MIT
