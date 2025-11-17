import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("bun commands", () => {
  describe("basic commands", () => {
    test("bun add single package", () => {
      const result = packmorph("bun add react");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install react");
        expect(result.pnpm).toBe("pnpm add react");
        expect(result.yarn).toBe("yarn add react");
        expect(result.bun).toBe("bun add react");
        expect(result.meta.manager).toBe("bun");
        expect(result.meta.packages).toEqual(["react"]);
      }
    });

    test("bun add multiple packages", () => {
      const result = packmorph("bun add react react-dom");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install react react-dom");
        expect(result.pnpm).toBe("pnpm add react react-dom");
        expect(result.yarn).toBe("yarn add react react-dom");
        expect(result.bun).toBe("bun add react react-dom");
        expect(result.meta.packages).toEqual(["react", "react-dom"]);
      }
    });

    test("bun install (no packages)", () => {
      const result = packmorph("bun install");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install");
        expect(result.pnpm).toBe("pnpm install");
        expect(result.yarn).toBe("yarn install");
        expect(result.bun).toBe("bun install");
        expect(result.meta.packages).toEqual([]);
      }
    });
  });

  describe("flags", () => {
    test("bun add --dev", () => {
      const result = packmorph("bun add --dev typescript");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -D typescript");
        expect(result.pnpm).toBe("pnpm add -D typescript");
        expect(result.yarn).toBe("yarn add --dev typescript");
        expect(result.bun).toBe("bun add --dev typescript");
        expect(result.meta.dev).toBe(true);
      }
    });

    test("bun add -d (lowercase)", () => {
      const result = packmorph("bun add -d typescript");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -D typescript");
        expect(result.pnpm).toBe("pnpm add -D typescript");
        expect(result.yarn).toBe("yarn add --dev typescript");
        expect(result.bun).toBe("bun add --dev typescript");
        expect(result.meta.dev).toBe(true);
      }
    });

    test("bun add -g", () => {
      const result = packmorph("bun add -g eslint");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -g eslint");
        expect(result.pnpm).toBe("pnpm add -g eslint");
        expect(result.yarn).toBe("yarn global add eslint");
        expect(result.bun).toBe("bun add -g eslint");
        expect(result.meta.global).toBe(true);
      }
    });

    test("bun add --global", () => {
      const result = packmorph("bun add --global eslint");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -g eslint");
        expect(result.pnpm).toBe("pnpm add -g eslint");
        expect(result.yarn).toBe("yarn global add eslint");
        expect(result.bun).toBe("bun add -g eslint");
        expect(result.meta.global).toBe(true);
      }
    });

    test("bun add --exact", () => {
      const result = packmorph("bun add --exact react");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -E react");
        expect(result.pnpm).toBe("pnpm add -E react");
        expect(result.yarn).toBe("yarn add --exact react");
        expect(result.bun).toBe("bun add --exact react");
        expect(result.meta.exact).toBe(true);
      }
    });

    test("bun add -E", () => {
      const result = packmorph("bun add -E react");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -E react");
        expect(result.pnpm).toBe("pnpm add -E react");
        expect(result.yarn).toBe("yarn add --exact react");
        expect(result.bun).toBe("bun add --exact react");
        expect(result.meta.exact).toBe(true);
      }
    });

    test("bun add with multiple flags", () => {
      const result = packmorph("bun add -d -E typescript");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -D -E typescript");
        expect(result.pnpm).toBe("pnpm add -D -E typescript");
        expect(result.yarn).toBe("yarn add --dev --exact typescript");
        expect(result.bun).toBe("bun add --dev --exact typescript");
        expect(result.meta.dev).toBe(true);
        expect(result.meta.exact).toBe(true);
      }
    });
  });
});
