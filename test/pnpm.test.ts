import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("pnpm commands", () => {
  describe("basic commands", () => {
    test("pnpm add single package", () => {
      const result = packmorph("pnpm add react");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install react");
        expect(result.pnpm).toBe("pnpm add react");
        expect(result.yarn).toBe("yarn add react");
        expect(result.bun).toBe("bun add react");
        expect(result.meta.manager).toBe("pnpm");
        expect(result.meta.packages).toEqual(["react"]);
      }
    });

    test("pnpm add multiple packages", () => {
      const result = packmorph("pnpm add react react-dom");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install react react-dom");
        expect(result.pnpm).toBe("pnpm add react react-dom");
        expect(result.yarn).toBe("yarn add react react-dom");
        expect(result.bun).toBe("bun add react react-dom");
        expect(result.meta.packages).toEqual(["react", "react-dom"]);
      }
    });

    test("pnpm install (no packages)", () => {
      const result = packmorph("pnpm install");
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
    test("pnpm add -D", () => {
      const result = packmorph("pnpm add -D typescript");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -D typescript");
        expect(result.pnpm).toBe("pnpm add -D typescript");
        expect(result.yarn).toBe("yarn add --dev typescript");
        expect(result.bun).toBe("bun add --dev typescript");
        expect(result.meta.dev).toBe(true);
      }
    });

    test("pnpm add -g", () => {
      const result = packmorph("pnpm add -g eslint");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -g eslint");
        expect(result.pnpm).toBe("pnpm add -g eslint");
        expect(result.yarn).toBe("yarn global add eslint");
        expect(result.bun).toBe("bun add -g eslint");
        expect(result.meta.global).toBe(true);
      }
    });

    test("pnpm add with exact flag", () => {
      const result = packmorph("pnpm add -E react");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.npm).toBe("npm install -E react");
        expect(result.pnpm).toBe("pnpm add -E react");
        expect(result.yarn).toBe("yarn add --exact react");
        expect(result.bun).toBe("bun add --exact react");
        expect(result.meta.exact).toBe(true);
      }
    });
  });
});
