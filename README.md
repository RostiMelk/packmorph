# packmorph

Translate package manager install commands between npm, pnpm, Yarn, and Bun.

[![npm version](https://badge.fury.io/js/packmorph.svg)](https://badge.fury.io/js/packmorph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```typescript
import { packmorph } from "packmorph";

// From npm
const result1 = packmorph("npm install -D typescript");
if (result1.ok) {
  console.log(result1.npm); // npm install -D typescript
  console.log(result1.pnpm); // pnpm add -D typescript
  console.log(result1.yarn); // yarn add --dev typescript
  console.log(result1.bun); // bun add --dev typescript
}

// From yarn
const result2 = packmorph("yarn global add eslint");
if (result2.ok) {
  console.log(result2.npm); // npm install -g eslint
  console.log(result2.pnpm); // pnpm add -g eslint
  console.log(result2.yarn); // yarn global add eslint
  console.log(result2.bun); // bun add -g eslint
}

// From bun
const result3 = packmorph("bun add -d vitest");
if (result3.ok) {
  console.log(result3.npm); // npm install -D vitest
  console.log(result3.pnpm); // pnpm add -D vitest
  console.log(result3.yarn); // yarn add --dev vitest
  console.log(result3.bun); // bun add --dev vitest
}
```

## Install

```bash
npm install packmorph
```

## What it does

Give it an install command from any of the four major package managers (npm, pnpm, Yarn, or Bun), and it returns the equivalent command for all of them. Useful for documentation, tooling, or learning how commands translate across ecosystems.

**Accepts:**

- `npm install` / `npm i`
- `pnpm add` / `pnpm install`
- `yarn add` / `yarn install` / `yarn global add`
- `bun add` / `bun install`

**Returns commands for:**

- npm
- pnpm
- Yarn
- Bun

## Flags supported

All the common ones work: `-D` (dev), `-g` (global), `-E` (exact), `-O` (optional), `-P` (peer), `--frozen-lockfile`.

Version specifiers are preserved: `react@18.2.0`, `@types/node`, `package@next`, etc.

### Flag Normalization

When converting from Yarn or Bun commands, flags are automatically normalized to npm/pnpm style:

- `yarn add --dev` → `npm install -D` (long form → short form)
- `bun add -d` → `npm install -D` (lowercase → uppercase)
- `yarn add --exact` → `npm install -E`
- `bun add --global` → `npm install -g`

This ensures consistent, idiomatic output for each package manager.

## API

```typescript
packmorph(command: string): PackmorphResult
```

**Success:**

```typescript
{
  ok: true,
  npm: string,
  pnpm: string,
  yarn: string,
  bun: string,
  meta: {
    manager: "npm" | "pnpm" | "yarn" | "bun",
    packages: string[],
    dev: boolean,
    global: boolean,
    // ... other flags
  }
}
```

**Error:**

```typescript
{
  ok: false,
  reason: "not-install-command" | "parse-error"
}
```

## License

MIT
