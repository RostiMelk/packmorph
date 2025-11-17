import { describe, expect, test } from "bun:test";
import { packmorph } from "../src/index";

describe("package version specifiers", () => {
  test("preserves version specifier", () => {
    const result = packmorph("npm install react@18.2.0");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["react@18.2.0"]);
      expect(result.npm).toContain("react@18.2.0");
      expect(result.pnpm).toContain("react@18.2.0");
    }
  });

  test("preserves caret version", () => {
    const result = packmorph("npm install react@^18.0.0");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["react@^18.0.0"]);
    }
  });

  test("preserves tag specifier", () => {
    const result = packmorph("npm install react@next");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["react@next"]);
    }
  });

  test("preserves scoped packages", () => {
    const result = packmorph("npm install @types/node");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["@types/node"]);
    }
  });

  test("preserves scoped packages with version", () => {
    const result = packmorph("npm install @types/node@20.0.0");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["@types/node@20.0.0"]);
    }
  });
});

describe("edge cases", () => {
  test("handles extra whitespace", () => {
    const result = packmorph("  npm   install   react  ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["react"]);
    }
  });

  test("handles flags before and after packages", () => {
    const result = packmorph("npm install -D react -E");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.dev).toBe(true);
      expect(result.meta.exact).toBe(true);
      expect(result.meta.packages).toEqual(["react"]);
    }
  });

  test("handles -- in the middle (should continue parsing after it)", () => {
    const result = packmorph("npm install -- react");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meta.packages).toEqual(["react"]);
    }
  });
});
